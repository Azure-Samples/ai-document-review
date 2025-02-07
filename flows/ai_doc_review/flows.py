import os
from pathlib import Path

from promptflow.client import load_flow
from promptflow.connections import AzureOpenAIConnection
from promptflow.entities import FlowContext
from typing import List


AZURE_OPENAI_ENDPOINT = os.environ.get("AZURE_OPENAI_ENDPOINT")

MODELS_MODULE_PATH = Path(__file__).parent / "common" / "models.py"
TEMPLATE_FLOW_PATH = Path(__file__).parent / "agent_template"
PROMPTS_PATH = Path(__file__).parent / "prompts"

GENERIC_AGENT_PROMPT = PROMPTS_PATH / "agent.jinja2"
GENERIC_CONSOLIDATOR_PROMPT = PROMPTS_PATH / "consolidator.jinja2"


def create_flow(connection):
    flow = load_flow(TEMPLATE_FLOW_PATH)
    flow.context = FlowContext(
        connections={
            "llm_multishot": {"connection": connection},
            "consolidator": {"connection": connection},
        },
        overrides={
            "nodes.agent_prompt.source.path": str(GENERIC_AGENT_PROMPT),
            "nodes.consolidator_prompt.source.path": str(GENERIC_CONSOLIDATOR_PROMPT),
            "nodes.llm_multishot.inputs.module_path": str(MODELS_MODULE_PATH),
            "nodes.consolidator.inputs.module_path": str(MODELS_MODULE_PATH),
        }
    )
    return flow


def setup_flows(issue_types: List[str]):
    connection = AzureOpenAIConnection(
        name="connection",
        auth_mode="meid_token",
        api_base=AZURE_OPENAI_ENDPOINT
    )

    return {
        issue_type: create_flow(
            connection=connection,
        )
        for issue_type in issue_types
    }
