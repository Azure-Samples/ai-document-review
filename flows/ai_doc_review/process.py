import logging
from agents_service import fetch_latest_prompt_by_type, retrieve_distinct_agent_types
from promptflow.core import tool
from concurrent.futures import ThreadPoolExecutor as Pool
from typing import Callable, Generator, Any
from functools import partial
from typing import Tuple
from bounding_box import add_bounding_box
from common.models import AllCombinedIssues
from text import analyze_document, get_text_chunks
from flows import setup_flows


def run_flow(flow: Tuple[str, Callable], text: str) -> Tuple[str, Any]:
    issue_type, flow_function = flow
    logging.info(f"Running flow for flow_function")
    guideline_prompt = str(fetch_latest_prompt_by_type(issue_type))
    if not guideline_prompt:
        logging.error(f"Invalid guidline prompt found: {issue_type}")
        raise ValueError(f"Guideline prompt not found for issue type: {issue_type}")
    return issue_type, flow_function(text=text, issue_type=issue_type, guideline_prompt_text=guideline_prompt)


def get_issues_from_text_chunks(pdf_name: str, pagination: int) -> Generator[Any, Any, Any]:
    logging.info(f"Getting issue types")
    issue_types = retrieve_distinct_agent_types()
    logging.info(f"Setting up flows")
    flows = setup_flows(issue_types)
    di_result = analyze_document(pdf_name)
    with Pool() as pool:
        for text_chunk in get_text_chunks(di_result, paragraphs_per_chunk=pagination):
            agent_flow_results = pool.map(partial(run_flow, text=text_chunk), flows.items())

            logging.info(f"Processing agent results")
            for issue_type, agent_results in agent_flow_results:
                output = AllCombinedIssues.model_validate_json(agent_results["agent_output"])
    
                logging.info(f"Adding issue type and bounding box to issues")
                for issue in output.issues:
                    logging.debug(f"Adding issue type and bounding box to issue: {issue}")
                    issue.type = issue_type
                    try:
                        issue = add_bounding_box(di_result, issue)
                    except Exception as e:
                        logging.exception(e)
                        logging.error(f"Unable to add bounding box to issue. Unexpected error occurred", str(issue))

                yield output.issues


@tool
def process(pdf_name: str) -> str:
    all_issues = []
    for issues in get_issues_from_text_chunks(pdf_name, pagination=64):
        all_issues.extend(issues) 

    # Return all issues for this chunk of text
    return AllCombinedIssues(issues=all_issues).model_dump_json()