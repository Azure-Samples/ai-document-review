import os
from services.aml_client import AMLClient
from database.issues_repository import IssuesRepository
from services.issues_service import IssuesService
from azure.identity import DefaultAzureCredential, ClientAssertionCredential, AzureCliCredential
from config.config import settings


def get_issues_service() -> IssuesService:
    return IssuesService(IssuesRepository(), get_aml_client())

def get_aml_client():
    if "WEBSITE_INSTANCE_ID" in os.environ:
        credential = ClientAssertionCredential(
            settings.aad_tenant_id,
            os.environ.get('FLOW_CLIENT_ID'),
            lambda: DefaultAzureCredential().get_token("api://AzureADTokenExchange/.default").token
        )
    else:
        credential = AzureCliCredential()

    return AMLClient(credential)
