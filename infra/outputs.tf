output "webapp_name" {
  value = azurerm_linux_web_app.app.name
}

output "webapp_url" {
  value = azurerm_linux_web_app.app.default_hostname
}

output "resource_group" {
  value = azurerm_resource_group.main.name
}

output "ai_hub_project_name" {
  value = azapi_resource.ai_project.name
}

output "flowapp_name" {
  value = azurerm_linux_web_app.flow.name
}

output "flow_app_id_uri" {
  value = "api://adr-flow-${var.name}-${var.environment}"
}
