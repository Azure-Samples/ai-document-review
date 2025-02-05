from typing import Any, Callable, Generator, Tuple
from prompt_service import fetch_latest_prompt_by_type, retrieve_distinct_agent_types
from promptflow.core import tool
from concurrent.futures import ThreadPoolExecutor as Pool
from functools import partial
import logging

from bounding_box import add_bounding_box
from common.models import AllCombinedIssues
from text import analyze_document, get_text_chunks


def run_flow(text: str, agent_type: str) -> Tuple[str, Any]:
    """
    Runs the flow for a given text chunk and agent type.
    Fetches the guideline prompt for the agent type dynamically.
    """
    agent_prompt = fetch_latest_prompt_by_type(agent_type)
    # Here you need to call the flow function for the text chunk using the prompt
    # Assuming flow_function takes text and prompt as arguments
    result = {
        "agent_output": f"Processed text with agent type '{agent_type}' and prompt '{agent_prompt}'"
    }
    return agent_type, result


def get_issues_from_text_chunks(pdf_name: str, pagination: int) -> Generator[Any, Any, Any]:
    di_result = analyze_document(pdf_name)

    agent_types = retrieve_distinct_agent_types()

    with Pool() as pool:
        for text_chunk in get_text_chunks(di_result, paragraphs_per_chunk=pagination):
            agent_flow_results = pool.map(
                partial(run_flow, text=text_chunk),
                agent_types
            )

            for issue_type, agent_results in agent_flow_results:
                output = AllCombinedIssues.model_validate_json(agent_results["agent_output"])
    
                for issue in output.issues:
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

    return AllCombinedIssues(issues=all_issues).model_dump_json()
