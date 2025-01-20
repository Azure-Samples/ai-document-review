locals {
  resource_name = {
    resource_group             = "rg-${var.name}-${var.environment}"
    network_security_perimeter = "nsp-${var.name}-${var.environment}"
    key_vault                  = "kv${var.name}${var.environment}"
    ai_services                = "ais-${var.name}-${var.environment}"
    ai_hub                     = "aih-${var.name}-${var.environment}"
    ai_project                 = "aip-${var.name}-${var.environment}"
    storage_account            = "str${var.name}${var.environment}"
    container_registry         = "acr${var.name}${var.environment}"
    cosmos_db                  = "cdb-${var.name}-${var.environment}"
    app_service_plan           = "asp-${var.name}-${var.environment}"
    web_api_app                = "as-app-${var.name}-${var.environment}"
    web_flow_app               = "as-flw-${var.name}-${var.environment}"
    application_insights       = "ai-${var.name}-${var.environment}"
    aad_api_app                = "adr-api-${var.name}-${var.environment}"
    aad_client_app             = "adr-client-${var.name}-${var.environment}"
    aad_flow_app               = "adr-flow-${var.name}-${var.environment}"
    umi_ai_compute             = "uid-aic-${var.name}-${var.environment}"
    umi_api                   = "uid-api-${var.name}-${var.environment}"
  }

  common_tags = {}
}
