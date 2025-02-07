import os
from pathlib import Path

from promptflow.client import load_flow
from promptflow.connections import AzureOpenAIConnection
from promptflow.entities import FlowContext
from common.models import IssueType

AZURE_OPENAI_ENDPOINT = os.environ.get("AZURE_OPENAI_ENDPOINT")

MODELS_MODULE_PATH = Path(__file__).parent / "common" / "models.py"
TEMPLATE_FLOW_PATH = Path(__file__).parent / "agent_template"
PROMPTS_PATH = Path(__file__).parent / "prompts"

AGENT_PROMPTS = {
   IssueType.GrammarSpelling: {
       "agent": PROMPTS_PATH / "grammar" / "agent.jinja2",
       "consolidator": PROMPTS_PATH / "grammar" / "consolidator.jinja2",
       "guidelines": PROMPTS_PATH / "grammar" / "guidelines.jinja2",
   },
    IssueType.DefinitiveLanguage: {
         "agent": PROMPTS_PATH / "definitive_language" / "agent.jinja2",
         "consolidator": PROMPTS_PATH / "definitive_language" / "consolidator.jinja2",
         "guidelines": PROMPTS_PATH / "definitive_language" / "guidelines.jinja2",
    }
}


def create_flow(agent_prompt_path, consolidator_prompt_path, connection):
    flow = load_flow(TEMPLATE_FLOW_PATH)
    flow.context = FlowContext(
        connections={
            "llm_multishot": {"connection": connection},
            "consolidator": {"connection": connection},
        },
        overrides={
            "nodes.agent_prompt.source.path": str(agent_prompt_path),
            "nodes.consolidator_prompt.source.path": str(consolidator_prompt_path),
            "nodes.llm_multishot.inputs.module_path": str(MODELS_MODULE_PATH),
            "nodes.consolidator.inputs.module_path": str(MODELS_MODULE_PATH),
        }
    )
    return flow


def setup_flows():
    connection = AzureOpenAIConnection(
        name="connection",
        auth_mode="meid_token",  # use Entra
        api_base=AZURE_OPENAI_ENDPOINT
    )

    return {
        issue_type: create_flow(
            agent_prompt_path=AGENT_PROMPTS[issue_type]["agent"],
            consolidator_prompt_path=AGENT_PROMPTS[issue_type]["consolidator"],
            connection=connection,
        )
        for issue_type in AGENT_PROMPTS
    }
