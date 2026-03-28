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

# ---- DynamoDB table outputs ----

output "dynamodb_students_table_name" {
  description = "Name of the Students DynamoDB table"
  value       = aws_dynamodb_table.students.name
}

output "dynamodb_students_table_arn" {
  description = "ARN of the Students DynamoDB table"
  value       = aws_dynamodb_table.students.arn
}

output "dynamodb_sessions_table_name" {
  description = "Name of the Sessions DynamoDB table"
  value       = aws_dynamodb_table.sessions.name
}

output "dynamodb_sessions_table_arn" {
  description = "ARN of the Sessions DynamoDB table"
  value       = aws_dynamodb_table.sessions.arn
}

output "dynamodb_payments_table_name" {
  description = "Name of the Payments DynamoDB table"
  value       = aws_dynamodb_table.payments.name
}

output "dynamodb_payments_table_arn" {
  description = "ARN of the Payments DynamoDB table"
  value       = aws_dynamodb_table.payments.arn
}

output "dynamodb_events_table_name" {
  description = "Name of the Events DynamoDB table"
  value       = aws_dynamodb_table.events.name
}

output "dynamodb_events_table_arn" {
  description = "ARN of the Events DynamoDB table"
  value       = aws_dynamodb_table.events.arn
}

output "dynamodb_resources_table_name" {
  description = "Name of the Resources DynamoDB table"
  value       = aws_dynamodb_table.resources.name
}

output "dynamodb_resources_table_arn" {
  description = "ARN of the Resources DynamoDB table"
  value       = aws_dynamodb_table.resources.arn
}

# ---- App Runner outputs ----

output "backend_url" {
  description = "URL of the App Runner backend service"
  value       = "https://${aws_apprunner_service.backend.service_url}"
}

output "ecr_repository_url" {
  description = "URL of the ECR repository for the backend image"
  value       = aws_ecr_repository.backend.repository_url
}
