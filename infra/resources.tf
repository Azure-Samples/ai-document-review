/*
  Resource
  - Resource Group
*/

resource "azurerm_resource_group" "main" {
  name     = local.resource_name.resource_group
  location = var.location

  tags = merge(local.common_tags, {})
}

/*
  Network
  - Security Perimeter
*/

resource "azapi_resource" "nsp" {
  type      = "Microsoft.Network/networkSecurityPerimeters@2023-08-01-preview"
  name      = local.resource_name.network_security_perimeter
  location  = azurerm_resource_group.main.location
  parent_id = azurerm_resource_group.main.id

  body = {
    properties = {}
  }

  tags = merge(local.common_tags, {})
}

resource "azapi_resource" "nsp_profile" {
  type      = "Microsoft.Network/networkSecurityPerimeters/profiles@2023-08-01-preview"
  name      = "default"
  location  = azurerm_resource_group.main.location
  parent_id = azapi_resource.nsp.id

  body = {
    properties = {}
  }
}

resource "azapi_resource" "nsp_association" {
  type      = "Microsoft.Network/networkSecurityPerimeters/resourceAssociations@2023-08-01-preview"
  name      = each.key
  location  = azurerm_resource_group.main.location
  parent_id = azapi_resource.nsp.id

  body = {
    properties = {
      accessMode = "Learning"
      privateLinkResource = {
        id = each.value
      }
      profile = {
        id = azapi_resource.nsp_profile.id
      }
    }
  }

  for_each = tomap({
    "${local.resource_name.cosmos_db}"       = azurerm_cosmosdb_account.main.id
    "${local.resource_name.key_vault}"       = azurerm_key_vault.main.id
    "${local.resource_name.storage_account}" = azurerm_storage_account.main.id
  })
}

/*
  Intelligence
  - AI Foundry
  - AI Hub
  - AI Project
  - AI Connections
*/

resource "azapi_resource" "ai_services" {
  type      = "Microsoft.CognitiveServices/accounts@2024-10-01"
  name      = local.resource_name.ai_services
  location  = azurerm_resource_group.main.location
  parent_id = azurerm_resource_group.main.id

  identity {
    type = "SystemAssigned"
  }

  body = {
    name = "ais-${var.name}-${var.environment}"
    properties = {
      customSubDomainName = "ais${var.name}${var.environment}"
      apiProperties = {
        statisticsEnabled = false,
      }
      restore             = contains([for service in data.azapi_resource_list.ai_services.output.value : service.name], local.resource_name.ai_services)
      publicNetworkAccess = "Enabled"
    }
    kind = "AIServices"
    sku = {
      name = "S0"
    }
  }

  response_export_values = ["*"]

  tags = merge(local.common_tags, {})
}

resource "azurerm_cognitive_deployment" "main" {
  name = var.gpt_model_name

  cognitive_account_id = azapi_resource.ai_services.output.id

  model {
    format  = "OpenAI"
    name    = var.gpt_model_name
    version = var.gpt_model_version
  }

  sku {
    name     = "GlobalStandard"
    capacity = var.gpt_model_capacity
  }
}

resource "azapi_resource" "ai_hub" {
  type      = "Microsoft.MachineLearningServices/workspaces@2024-10-01"
  name      = local.resource_name.ai_hub
  location  = azurerm_resource_group.main.location
  parent_id = azurerm_resource_group.main.id

  identity {
    type = "SystemAssigned"
  }

  body = {
    properties = {
      description         = "Azure AI hub"
      friendlyName        = var.ai_hub_name
      storageAccount      = azurerm_storage_account.main.id
      keyVault            = azurerm_key_vault.main.id
      applicationInsights = azurerm_application_insights.main.id
      containerRegistry   = azurerm_container_registry.main.id
      managedNetwork = {
        isolationMode = "AllowInternetOutbound"
      }
    }
    kind = "Hub"
  }

  lifecycle {
    ignore_changes = [
      tags
    ]
  }

  tags = merge(local.common_tags, {})
}

resource "azapi_resource" "ai_project" {
  type      = "Microsoft.MachineLearningServices/workspaces@2024-10-01"
  name      = local.resource_name.ai_project
  location  = azurerm_resource_group.main.location
  parent_id = azurerm_resource_group.main.id

  identity {
    type = "SystemAssigned"
  }

  body = {
    properties = {
      description   = "Azure AI Project"
      friendlyName  = var.ai_project_name
      hubResourceId = azapi_resource.ai_hub.id
    }
    kind = "Project"
  }

  response_export_values = ["*"]

  tags = merge(local.common_tags, {})
}

resource "azapi_resource" "ai_services_connection" {
  type      = "Microsoft.MachineLearningServices/workspaces/connections@2024-10-01"
  name      = "aisconns"
  parent_id = azapi_resource.ai_hub.id

  body = {
    properties = {
      category      = "AIServices"
      target        = azapi_resource.ai_services.output.properties.endpoint
      authType      = "AAD"
      isSharedToAll = true
      metadata = {
        ApiType    = "Azure"
        ResourceId = azapi_resource.ai_services.id
      }
    }
  }
  response_export_values = ["*"]
}

resource "azapi_resource" "document_storage_connection" {
  type      = "Microsoft.MachineLearningServices/workspaces/connections@2024-04-01-preview"
  name      = "document_storage"
  parent_id = azapi_resource.ai_hub.id

  body = {
    properties = {
      category = "CustomKeys"
      authType = "CustomKeys"
      credentials = {
        keys = {
          url_prefix = "${azurerm_storage_account.main.primary_blob_endpoint}/${azurerm_storage_container.documents.name}"
        }
      }
    }
  }
}

/*
  Application
  - App Service
  - Application Insights
  - Key Vault
  - Storage Account
  - CosmosDB
*/

resource "azurerm_service_plan" "main" {
  name                = local.resource_name.app_service_plan
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name

  os_type  = "Linux"
  sku_name = "P0v3"

  tags = merge(local.common_tags, {})
}

resource "azurerm_linux_web_app" "app" {
  name                = local.resource_name.web_api_app
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name

  service_plan_id                                = azurerm_service_plan.main.id
  public_network_access_enabled                  = true
  https_only                                     = true
  ftp_publish_basic_authentication_enabled       = false
  webdeploy_publish_basic_authentication_enabled = false

  identity {
    type = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.api.id]
  }

  site_config {
    websockets_enabled = true
    app_command_line   = "gunicorn -w 2 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000 --timeout 600 main:app"

    application_stack {
      python_version = "3.12"
    }
  }

  app_settings = {
    "SCM_DO_BUILD_DURING_DEPLOYMENT"  = "true"
    "DEBUG"                           = "True"
    "STORAGE_ACCOUNT_URL"             = "https://${azurerm_storage_account.main.name}.blob.core.windows.net"
    "STORAGE_CONTAINER_NAME"          = azurerm_storage_container.documents.name
    "COSMOS_URL"                      = azurerm_cosmosdb_account.main.endpoint
    "DATABASE_NAME"                   = azurerm_cosmosdb_sql_database.state.name
    "AAD_CLIENT_ID"                   = azuread_application.api_app.client_id
    "AAD_TENANT_ID"                   = data.azurerm_client_config.current.tenant_id
    "AZURE_CLIENT_ID"                 = azurerm_user_assigned_identity.api.client_id
    "SUBSCRIPTION_ID"                 = data.azurerm_subscription.primary.subscription_id
    "RESOURCE_GROUP"                  = azurerm_resource_group.main.name
    "AI_HUB_PROJECT_NAME"             = azapi_resource.ai_project.name
    "AI_HUB_REGION"                   = azapi_resource.ai_hub.location
    "FLOW_CLIENT_ID"                  = azuread_application.flow_app.client_id
    "FLOW_ENDPOINT_NAME"              = azurerm_linux_web_app.flow.name
    "FLOW_APP_NAME"                   = azuread_application.flow_app.display_name
    "FLOW_STREAMING_BATCH_SIZE"       = 100
    "APPINSIGHTS_INSTRUMENTATION_KEY" = azurerm_application_insights.main.instrumentation_key
    "LOG_LEVEL"                       = "INFO"
    "SERVE_STATIC"                    = "True"
  }

  logs {
    application_logs {
      file_system_level = "Verbose"
    }
    http_logs {
      file_system {
        retention_in_days = "1"
        retention_in_mb   = "35"
      }
    }
    detailed_error_messages = true
    failed_request_tracing  = true
  }

  tags = merge(local.common_tags, {})
}

resource "azurerm_linux_web_app" "flow" {
  name                = local.resource_name.web_flow_app
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name

  service_plan_id                                = azurerm_service_plan.main.id
  public_network_access_enabled                  = true
  https_only                                     = true
  ftp_publish_basic_authentication_enabled       = false
  webdeploy_publish_basic_authentication_enabled = false

  identity {
    type         = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.ai_compute.id]
  }

  site_config {
    websockets_enabled = true
    app_command_line   = "pf flow serve --source . --port 8000 --host 0.0.0.0 --engine fastapi --skip-open-browser"

    application_stack {
      python_version = "3.12"
    }
  }

  app_settings = {
    "SCM_DO_BUILD_DURING_DEPLOYMENT"           = "true"
    "DEBUG"                                    = "True"
    "DOCUMENT_INTELLIGENCE_ENDPOINT"           = "https://ais${var.name}${var.environment}.cognitiveservices.azure.com"
    "STORAGE_URL_PREFIX"                       = "${azurerm_storage_account.main.primary_blob_endpoint}/${azurerm_storage_container.documents.name}"
    "AZURE_OPENAI_ENDPOINT"                    = "https://ais${var.name}${var.environment}.openai.azure.com"
    "AZURE_CLIENT_ID"                          = azurerm_user_assigned_identity.ai_compute.client_id
    "MICROSOFT_PROVIDER_AUTHENTICATION_SECRET" = azuread_application_password.flow_app.value
    "USER_AGENT"                               = "promptflow-appservice"
    "APPLICATIONINSIGHTS_CONNECTION_STRING"    = azurerm_application_insights.main.connection_string
  }

  auth_settings_v2 {
    auth_enabled           = true
    require_authentication = true
    unauthenticated_action = "Return401"
    require_https          = true
    active_directory_v2 {
      tenant_auth_endpoint = "https://login.microsoftonline.com/${data.azurerm_client_config.current.tenant_id}/v2.0"
      client_id                  = azuread_application.flow_app.client_id
      client_secret_setting_name = "MICROSOFT_PROVIDER_AUTHENTICATION_SECRET"
      allowed_audiences          = ["${azuread_application.flow_app.client_id}"]
      allowed_applications = [
        "${azuread_application.flow_app.client_id}",
        "04b07795-8ddb-461a-bbee-02f9e1bf7b46" # Azure CLI
      ]
      www_authentication_disabled = true
    }
    login {
      token_store_enabled = true
    }
  }

  logs {
    application_logs {
      file_system_level = "Verbose"
    }
    http_logs {
      file_system {
        retention_in_days = "1"
        retention_in_mb   = "35"
      }
    }
    detailed_error_messages = true
    failed_request_tracing  = true
  }
}

resource "azurerm_application_insights" "main" {
  name                = local.resource_name.application_insights
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name

  application_type = "web"

  tags = merge(local.common_tags, {})
}

resource "azurerm_key_vault" "main" {
  name                = local.resource_name.key_vault
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name

  tenant_id                = data.azurerm_client_config.current.tenant_id
  sku_name                 = "standard"
  purge_protection_enabled = false

  tags = merge(local.common_tags, {})
}

resource "azurerm_storage_account" "main" {
  name                = local.resource_name.storage_account
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name

  account_tier                     = "Standard"
  account_replication_type         = "LRS"
  allow_nested_items_to_be_public  = false
  https_traffic_only_enabled       = true
  min_tls_version                  = "TLS1_2"
  cross_tenant_replication_enabled = false

  blob_properties {
    cors_rule {
      allowed_headers = ["*"]
      allowed_methods = ["DELETE", "GET", "HEAD", "MERGE", "POST", "OPTIONS", "PUT", "PATCH"]
      allowed_origins = [
        "https://mlworkspace.azure.ai",
        "https://ml.azure.com",
        "https://*.ml.azure.com",
        "https://ai.azure.com",
        "https://*.ai.azure.com",
        "http://localhost:5173",
        "https://${local.resource_name.web_api_app}.azurewebsites.net"
      ]
      exposed_headers    = ["*"]
      max_age_in_seconds = 3600
    }
  }

  tags = merge(local.common_tags, {})
}

resource "azurerm_storage_container" "documents" {
  name = "documents"

  storage_account_id = azurerm_storage_account.main.id
}

resource "azurerm_container_registry" "main" {
  name                = local.resource_name.container_registry
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name

  sku                    = "Premium"
  admin_enabled          = false
  anonymous_pull_enabled = false

  tags = merge(local.common_tags, {})
}

resource "azurerm_cosmosdb_account" "main" {
  name                = local.resource_name.cosmos_db
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name

  offer_type                    = "Standard"
  local_authentication_disabled = true

  geo_location {
    location          = azurerm_resource_group.main.location
    failover_priority = 0
  }
  consistency_policy {
    consistency_level = "Eventual"
  }
  capabilities {
    name = "EnableServerless"
  }

  identity {
    type = "SystemAssigned"
  }

  tags = merge(local.common_tags, {})
}

resource "azurerm_cosmosdb_sql_database" "state" {
  name                = "state"
  resource_group_name = azurerm_cosmosdb_account.main.resource_group_name

  account_name = azurerm_cosmosdb_account.main.name
}

resource "azurerm_cosmosdb_sql_container" "issues" {
  name                = "issues"
  resource_group_name = azurerm_cosmosdb_sql_database.state.resource_group_name

  account_name  = azurerm_cosmosdb_account.main.name
  database_name = azurerm_cosmosdb_sql_database.state.name

  partition_key_paths = ["/doc_id"]
}
