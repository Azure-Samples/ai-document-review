/*
  User
  Provides access for the current identity (user etc) to Storage Account
*/

resource "azurerm_role_assignment" "deployer_file_share_contributor" {
  scope                = azurerm_storage_account.main.id
  role_definition_name = "Storage File Data Privileged Contributor"
  principal_id         = data.azurerm_client_config.current.object_id
}
resource "azurerm_role_assignment" "deployer_blob_data_contributor" {
  scope                = azurerm_storage_account.main.id
  role_definition_name = "Storage Blob Data Contributor"
  principal_id         = data.azurerm_client_config.current.object_id
}
resource "azurerm_cosmosdb_sql_role_assignment" "deployer_to_cosmos" {
  resource_group_name = azurerm_resource_group.main.name
  account_name        = azurerm_cosmosdb_account.main.name
  role_definition_id  = data.azurerm_cosmosdb_sql_role_definition.data_contributor.id
  principal_id        = data.azurerm_client_config.current.object_id
  scope               = "${azurerm_cosmosdb_account.main.id}/dbs/${azurerm_cosmosdb_sql_database.state.name}"
}

/*
  Group (ML Engineers)
  Provides access for the Security Group (ML Engineers) to Storage Account, AI Foundry and Cosmos DB
*/

resource "azurerm_role_assignment" "ai_studio_developer" {
  for_each             = var.ml_engineers
  scope                = azapi_resource.ai_hub.id
  role_definition_name = "Azure AI Developer"
  principal_id         = each.value
}
resource "azurerm_role_assignment" "cognitive_user" {
  for_each             = var.ml_engineers
  scope                = azapi_resource.ai_services.id
  role_definition_name = "Cognitive Services User"
  principal_id         = each.value
}
resource "azurerm_role_assignment" "openai_contributor" {
  for_each             = var.ml_engineers
  scope                = azapi_resource.ai_services.id
  role_definition_name = "Cognitive Services OpenAI Contributor"
  principal_id         = each.value
}

resource "azurerm_role_assignment" "file_share_contributor" {
  for_each             = var.ml_engineers
  scope                = azurerm_storage_account.main.id
  role_definition_name = "Storage File Data Privileged Contributor"
  principal_id         = each.value
}
resource "azurerm_role_assignment" "blob_data_contributor" {
  for_each             = var.ml_engineers
  scope                = azurerm_storage_account.main.id
  role_definition_name = "Storage Blob Data Contributor"
  principal_id         = each.value
}

resource "azurerm_cosmosdb_sql_role_assignment" "cosmos_user" {
  for_each            = var.ml_engineers
  resource_group_name = azurerm_resource_group.main.name
  account_name        = azurerm_cosmosdb_account.main.name
  role_definition_id  = data.azurerm_cosmosdb_sql_role_definition.data_contributor.id
  principal_id        = each.value
  scope               = "${azurerm_cosmosdb_account.main.id}/dbs/${azurerm_cosmosdb_sql_database.state.name}"
}

/*
  Web App
  Provides access for App Services to access AI Foundry, Storage Account and CosmosDB
*/

resource "azurerm_role_assignment" "app_to_prompt_flow" {
  scope                = azapi_resource.ai_project.id
  role_definition_name = "AzureML Data Scientist"
  principal_id         = azurerm_user_assigned_identity.api.principal_id
}
resource "azurerm_role_assignment" "app_to_storage" {
  scope                = azurerm_storage_account.main.id
  role_definition_name = "Storage Blob Data Contributor"
  principal_id         = azurerm_user_assigned_identity.api.principal_id
}
resource "azurerm_cosmosdb_sql_role_assignment" "webapp_to_cosmos" {
  resource_group_name = azurerm_resource_group.main.name
  account_name        = azurerm_cosmosdb_account.main.name
  role_definition_id  = data.azurerm_cosmosdb_sql_role_definition.data_contributor.id
  principal_id        = azurerm_user_assigned_identity.api.principal_id
  scope               = "${azurerm_cosmosdb_account.main.id}/dbs/${azurerm_cosmosdb_sql_database.state.name}"
}

/*
  AI Foundry
  Provides access for AI Foundry to access Storage Account
*/

resource "azurerm_role_assignment" "doc_intel_blob_data_contributor" {
  scope                = azurerm_storage_account.main.id
  role_definition_name = "Storage Blob Data Contributor"
  principal_id         = azapi_resource.ai_services.identity[0].principal_id
}
resource "azurerm_role_assignment" "ai_ws_file_share_contributor" {
  scope                = azurerm_storage_account.main.id
  role_definition_name = "Contributor"
  principal_id         = azapi_resource.ai_project.identity[0].principal_id
}

/*
  Managed Identity
  Provides access for AI Compute to access the required resources

  https://learn.microsoft.com/en-us/azure/machine-learning/prompt-flow/how-to-manage-compute-session
*/

resource "azurerm_user_assigned_identity" "ai_compute" {
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  name                = local.resource_name.umi_ai_compute
}

resource "azurerm_role_assignment" "uid_to_ai_hub" {
  scope                = azapi_resource.ai_hub.id
  role_definition_name = "Contributor"
  principal_id         = azurerm_user_assigned_identity.ai_compute.principal_id
}
resource "azurerm_role_assignment" "uid_to_ai_hub_project" {
  scope                = azapi_resource.ai_project.id
  role_definition_name = "Contributor"
  principal_id         = azurerm_user_assigned_identity.ai_compute.principal_id
}
resource "azurerm_role_assignment" "uid_to_storage" {
  scope                = azurerm_storage_account.main.id
  role_definition_name = "Contributor"
  principal_id         = azurerm_user_assigned_identity.ai_compute.principal_id
}
resource "azurerm_role_assignment" "uid_to_storage_blob" {
  scope                = azurerm_storage_account.main.id
  role_definition_name = "Storage Blob Data Contributor"
  principal_id         = azurerm_user_assigned_identity.ai_compute.principal_id
}
resource "azurerm_role_assignment" "uid_to_storage_file" {
  scope                = azurerm_storage_account.main.id
  role_definition_name = "Storage File Data Privileged Contributor"
  principal_id         = azurerm_user_assigned_identity.ai_compute.principal_id
}

resource "azurerm_role_assignment" "uid_to_kv" {
  scope                = azurerm_key_vault.main.id
  role_definition_name = "Contributor"
  principal_id         = azurerm_user_assigned_identity.ai_compute.principal_id
}
resource "azurerm_role_assignment" "uid_to_kv_admin" {
  scope                = azurerm_key_vault.main.id
  role_definition_name = "Key Vault Administrator"
  principal_id         = azurerm_user_assigned_identity.ai_compute.principal_id
}
resource "azurerm_role_assignment" "uid_to_acr" {
  scope                = azurerm_container_registry.main.id
  role_definition_name = "ACRPull"
  principal_id         = azurerm_user_assigned_identity.ai_compute.principal_id
}
resource "azurerm_role_assignment" "uid_to_app_ins" {
  scope                = azurerm_application_insights.main.id
  role_definition_name = "Contributor"
  principal_id         = azurerm_user_assigned_identity.ai_compute.principal_id
}
resource "azurerm_role_assignment" "uid_to_ai_services_dev" {
  scope                = azapi_resource.ai_services.id
  role_definition_name = "Azure AI Developer"
  principal_id         = azurerm_user_assigned_identity.ai_compute.principal_id
}
resource "azurerm_role_assignment" "uid_to_ai_services_user" {
  scope                = azapi_resource.ai_services.id
  role_definition_name = "Cognitive Services User"
  principal_id         = azurerm_user_assigned_identity.ai_compute.principal_id
}
resource "azurerm_role_assignment" "uid_to_ai_services_openai_user" {
  scope                = azapi_resource.ai_services.id
  role_definition_name = "Cognitive Services OpenAI User"
  principal_id         = azurerm_user_assigned_identity.ai_compute.principal_id
}
resource "azurerm_role_assignment" "uid_to_project_secrets" {
  scope                = azapi_resource.ai_project.id
  role_definition_name = "Azure Machine Learning Workspace Connection Secrets Reader"
  principal_id         = azurerm_user_assigned_identity.ai_compute.principal_id
}
resource "azurerm_role_assignment" "uid_to_workspace_metrics" {
  scope                = azapi_resource.ai_project.id
  role_definition_name = "AzureML Metrics Writer (preview)"
  principal_id         = azurerm_user_assigned_identity.ai_compute.principal_id
}

resource "azurerm_cosmosdb_sql_role_assignment" "uid_to_cosmos" {
  resource_group_name = azurerm_resource_group.main.name
  account_name        = azurerm_cosmosdb_account.main.name
  role_definition_id  = data.azurerm_cosmosdb_sql_role_definition.data_contributor.id
  principal_id        = azurerm_user_assigned_identity.ai_compute.principal_id
  scope               = "${azurerm_cosmosdb_account.main.id}/dbs/${azurerm_cosmosdb_sql_database.state.name}"
}

/*
  Managed Identity
  Provides access for the App Services to access the resources
*/

resource "azurerm_user_assigned_identity" "api" {
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  name                = local.resource_name.umi_api
}
