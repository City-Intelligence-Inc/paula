# ---------------------------------------------------------
# Input variables for the Mathitude infrastructure
# ---------------------------------------------------------

variable "vercel_api_token" {
  description = "Vercel API token for authentication"
  type        = string
  sensitive   = true
}

variable "team_id" {
  description = "Vercel team slug or ID"
  type        = string
  default     = "city-intelligence-inc"
}

variable "project_name" {
  description = "Name of the Vercel project"
  type        = string
  default     = "mathitude-website"
}

# ---- Clerk ----

variable "clerk_publishable_key" {
  description = "Clerk publishable key (NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)"
  type        = string
}

variable "clerk_secret_key" {
  description = "Clerk secret key (CLERK_SECRET_KEY)"
  type        = string
  sensitive   = true
}

# ---- Stripe ----

variable "stripe_secret_key" {
  description = "Stripe secret key (STRIPE_SECRET_KEY)"
  type        = string
  sensitive   = true
}

variable "stripe_publishable_key" {
  description = "Stripe publishable key (NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)"
  type        = string
}

# ---- AWS ----

variable "aws_region" {
  description = "AWS region for DynamoDB and other resources"
  type        = string
  default     = "us-west-2"
}

variable "environment" {
  description = "Deployment environment (e.g. production, staging)"
  type        = string
  default     = "production"
}

variable "table_prefix" {
  description = "Prefix for DynamoDB table names"
  type        = string
  default     = "mathitude"
}

variable "aws_access_key_id" {
  description = "AWS access key ID for programmatic access"
  type        = string
  sensitive   = true
}

variable "aws_secret_access_key" {
  description = "AWS secret access key for programmatic access"
  type        = string
  sensitive   = true
}
