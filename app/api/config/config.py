from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Define the settings with default values
    debug: bool = False
    aad_client_id: str = ""
    aad_tenant_id: str = ""
    aad_user_impersonation_scope_id: str = ""
    azure_client_id: str = ""
    serve_static: bool = True
    cosmos_url: str = ""
    cosmos_key: str = ""
    database_name: str = "state"
    issues_container: str = "issues"
    feedback_container: str = "feedback"
    storage_account_url: str = ""
    storage_container_name: str = "documents"
    subscription_id: str = ""
    resource_group: str = ""
    ai_hub_project_name: str = ""
    ai_hub_region: str = ""
    flow_endpoint_name: str = ""
    flow_app_name: str = ""
    flow_streaming_batch_size: int = 100
    appinsights_instrumentation_key: str = ""
    log_level: str = "INFO"
    model_config = SettingsConfigDict(env_file=".env")


settings = Settings()
