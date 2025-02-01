from database.agents_repository import AgentsRepository
from services.agents_service import AgentsService
from services.settings_service import SettingsService
from services.aml_client import AMLClient
from database.issues_repository import IssuesRepository
from database.settings_repository import SettingsRepository
from services.issues_service import IssuesService
from azure.identity import DefaultAzureCredential
from azure.ai.ml import MLClient
from config.config import settings

def get_settings_service() -> SettingsService:
    return SettingsService(SettingsRepository())

def get_agents_service() -> AgentsService:
    return AgentsService(AgentsRepository())

def get_issues_service() -> IssuesService:
    return IssuesService(IssuesRepository(), get_aml_client())

def get_aml_client():
    credential = DefaultAzureCredential()
    mlclient = MLClient(
        credential,
        settings.subscription_id,
        settings.resource_group,
        settings.ai_hub_project_name
    )
    return AMLClient(mlclient)
