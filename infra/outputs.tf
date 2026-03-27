# ---------------------------------------------------------
# Outputs from the Mathitude infrastructure
# ---------------------------------------------------------

output "deployment_url" {
  description = "URL of the Vercel deployment"
  value       = vercel_deployment.website.url
}

output "project_id" {
  description = "Vercel project ID"
  value       = vercel_project.website.id
}
