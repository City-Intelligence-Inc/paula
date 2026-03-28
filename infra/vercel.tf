# ---------------------------------------------------------
# Vercel project for the Mathitude K-12 math enrichment site
# ---------------------------------------------------------

resource "vercel_project" "website" {
  name      = var.project_name
  framework = "nextjs"

  git_repository = {
    type = "github"
    repo = "City-Intelligence-Inc/paula"
  }

  root_directory = "website"
}

# ---- Clerk authentication environment variables ----

resource "vercel_project_environment_variable" "clerk_publishable_key" {
  project_id = vercel_project.website.id
  key        = "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"
  value      = var.clerk_publishable_key
  target     = ["production", "preview", "development"]
}

resource "vercel_project_environment_variable" "clerk_secret_key" {
  project_id = vercel_project.website.id
  key        = "CLERK_SECRET_KEY"
  value      = var.clerk_secret_key
  target     = ["production", "preview", "development"]
}

resource "vercel_project_environment_variable" "clerk_sign_in_url" {
  project_id = vercel_project.website.id
  key        = "NEXT_PUBLIC_CLERK_SIGN_IN_URL"
  value      = "/sign-in"
  target     = ["production", "preview", "development"]
}

resource "vercel_project_environment_variable" "clerk_sign_up_url" {
  project_id = vercel_project.website.id
  key        = "NEXT_PUBLIC_CLERK_SIGN_UP_URL"
  value      = "/sign-up"
  target     = ["production", "preview", "development"]
}

# ---- Stripe payment environment variables ----

resource "vercel_project_environment_variable" "stripe_secret_key" {
  project_id = vercel_project.website.id
  key        = "STRIPE_SECRET_KEY"
  value      = var.stripe_secret_key
  target     = ["production", "preview", "development"]
}

resource "vercel_project_environment_variable" "stripe_publishable_key" {
  project_id = vercel_project.website.id
  key        = "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
  value      = var.stripe_publishable_key
  target     = ["production", "preview", "development"]
}

# ---- AWS / DynamoDB environment variables ----

resource "vercel_project_environment_variable" "aws_region" {
  project_id = vercel_project.website.id
  key        = "AWS_REGION"
  value      = var.aws_region
  target     = ["production", "preview", "development"]
}

resource "vercel_project_environment_variable" "aws_access_key_id" {
  project_id = vercel_project.website.id
  key        = "AWS_ACCESS_KEY_ID"
  value      = var.aws_access_key_id
  target     = ["production", "preview", "development"]
}

resource "vercel_project_environment_variable" "aws_secret_access_key" {
  project_id = vercel_project.website.id
  key        = "AWS_SECRET_ACCESS_KEY"
  value      = var.aws_secret_access_key
  target     = ["production", "preview", "development"]
}

resource "vercel_project_environment_variable" "dynamodb_table_prefix" {
  project_id = vercel_project.website.id
  key        = "DYNAMODB_TABLE_PREFIX"
  value      = var.table_prefix
  target     = ["production", "preview", "development"]
}

# ---- Backend API URL ----

resource "vercel_project_environment_variable" "api_url" {
  project_id = vercel_project.website.id
  key        = "NEXT_PUBLIC_API_URL"
  value      = "https://${aws_apprunner_service.backend.service_url}"
  target     = ["production", "preview", "development"]
}

# ---- Deployment ----

resource "vercel_deployment" "website" {
  project_id = vercel_project.website.id
  production = true

  # Path ref is informational; actual deploy is triggered via Vercel git
  # integration or the Vercel CLI.  The resource tracks deployment state.
}
