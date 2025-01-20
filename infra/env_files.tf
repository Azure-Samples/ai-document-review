# flows/.env
data "template_file" "flows_env" {
  template = file("${path.module}/../flows/.env.tpl")
  vars = {
    AI_HUB_PROJECT_NAME            = azapi_resource.ai_project.name
    SUBSCRIPTION_ID                = data.azurerm_subscription.primary.subscription_id
    RESOURCE_GROUP                 = azurerm_resource_group.main.name
    IDENTITY_CLIENT_ID             = azurerm_user_assigned_identity.ai_compute.client_id
    IDENTITY_RESOURCE_ID           = azurerm_user_assigned_identity.ai_compute.id
    DOCUMENT_INTELLIGENCE_ENDPOINT = "https://ais${var.name}${var.environment}.cognitiveservices.azure.com"
    AZURE_OPENAI_ENDPOINT          = "https://ais${var.name}${var.environment}.openai.azure.com"
  }
  depends_on = [
    azapi_resource.ai_project,
    azurerm_resource_group.main,
    azurerm_user_assigned_identity.ai_compute
  ]
}

resource "local_file" "flows_env" {
  content  = data.template_file.flows_env.rendered
  filename = "${path.module}/../flows/.env"
}

# app/ui/.env
data "template_file" "ui_env" {
  template = file("${path.module}/../app/ui/.env.tpl")
  vars = {
    VITE_TENANT_ID                  = data.azurerm_client_config.current.tenant_id
    VITE_CLIENT_ID                  = azuread_application.client_app.client_id
    VITE_API_SCOPE                  = "${tolist(azuread_application.api_app.identifier_uris)[0]}/user_impersonation"
    VITE_STORAGE_ACCOUNT            = azurerm_storage_account.main.primary_blob_endpoint
    VITE_STORAGE_DOCUMENT_CONTAINER = azurerm_storage_container.documents.name
  }
  depends_on = [
    azuread_application.client_app,
    azurerm_storage_account.main,
    azurerm_storage_container.documents
  ]
}

resource "local_file" "ui_env" {
  content  = data.template_file.ui_env.rendered
  filename = "${path.module}/../app/ui/.env"
}

# app/api/.env
data "template_file" "api_env" {
  template = file("${path.module}/../app/api/.env.tpl")
  vars = {
    AAD_CLIENT_ID                   = azuread_application.api_app.client_id
    AAD_TENANT_ID                   = data.azurerm_client_config.current.tenant_id
    AAD_USER_IMPERSONATION_SCOPE_ID = "${tolist(azuread_application.api_app.identifier_uris)[0]}/user_impersonation"
    AZURE_CLIENT_ID                 = azurerm_user_assigned_identity.api.client_id
    COSMOS_URL                      = azurerm_cosmosdb_account.main.endpoint
    DATABASE_NAME                   = azurerm_cosmosdb_sql_database.state.name
    SUBSCRIPTION_ID                 = data.azurerm_subscription.primary.subscription_id
    RESOURCE_GROUP                  = azurerm_resource_group.main.name
    AI_HUB_PROJECT_NAME             = azapi_resource.ai_project.name
    AI_HUB_REGION                   = azapi_resource.ai_hub.location
    FLOW_CLIENT_ID                  = azuread_application.flow_app.client_id
    FLOW_ENDPOINT_NAME              = azurerm_linux_web_app.flow.name
    FLOW_APP_NAME                   = azuread_application.flow_app.display_name
    APPINSIGHTS_INSTRUMENTATION_KEY = azurerm_application_insights.main.instrumentation_key
  }
  depends_on = [
    azuread_application.api_app,
    azurerm_cosmosdb_account.main,
    azurerm_cosmosdb_sql_database.state,
    azurerm_resource_group.main,
    azapi_resource.ai_project,
    azapi_resource.ai_hub,
    azurerm_application_insights.main
  ]
}

resource "local_file" "api_env" {
  content  = data.template_file.api_env.rendered
  filename = "${path.module}/../app/api/.env"
}
