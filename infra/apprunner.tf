# ---------------------------------------------------------
# AWS App Runner service for the Mathitude backend API
# ---------------------------------------------------------

# ECR repository for the backend image
resource "aws_ecr_repository" "backend" {
  name                 = "${var.table_prefix}-backend"
  image_tag_mutability = "MUTABLE"
  force_delete         = true

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Project = "mathitude"
  }
}

# IAM role for App Runner to access ECR
resource "aws_iam_role" "apprunner_ecr_access" {
  name = "${var.table_prefix}-apprunner-ecr-access"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "build.apprunner.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "apprunner_ecr_policy" {
  role       = aws_iam_role.apprunner_ecr_access.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSAppRunnerServicePolicyForECRAccess"
}

# IAM role for App Runner instance (DynamoDB + Stripe access)
resource "aws_iam_role" "apprunner_instance" {
  name = "${var.table_prefix}-apprunner-instance"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "tasks.apprunner.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy" "apprunner_dynamodb" {
  name = "dynamodb-access"
  role = aws_iam_role.apprunner_instance.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query",
        "dynamodb:Scan",
        "dynamodb:BatchWriteItem",
        "dynamodb:BatchGetItem"
      ]
      Resource = [
        "arn:aws:dynamodb:${var.aws_region}:*:table/${var.table_prefix}-*",
        "arn:aws:dynamodb:${var.aws_region}:*:table/${var.table_prefix}-*/index/*"
      ]
    }]
  })
}

# App Runner service
resource "aws_apprunner_service" "backend" {
  service_name = "${var.table_prefix}-backend"

  source_configuration {
    authentication_configuration {
      access_role_arn = aws_iam_role.apprunner_ecr_access.arn
    }

    image_repository {
      image_identifier      = "${aws_ecr_repository.backend.repository_url}:latest"
      image_repository_type = "ECR"

      image_configuration {
        port = "8080"
        runtime_environment_variables = {
          AWS_REGION            = var.aws_region
          DYNAMODB_TABLE_PREFIX = var.table_prefix
          CORS_ORIGIN           = "https://website-sage-three-98.vercel.app"
          # TODO: Move secrets below to AWS SSM Parameter Store or Secrets
          # Manager for production. App Runner's runtime_environment_secrets
          # expects ARNs to SSM parameters or Secrets Manager secrets, not
          # raw values. For now these are passed as plain env vars.
          STRIPE_SECRET_KEY     = var.stripe_secret_key
          CLERK_SECRET_KEY      = var.clerk_secret_key
          CLERK_PUBLISHABLE_KEY = var.clerk_publishable_key
        }
      }
    }

    auto_deployments_enabled = true
  }

  instance_configuration {
    cpu               = "0.25 vCPU"
    memory            = "0.5 GB"
    instance_role_arn = aws_iam_role.apprunner_instance.arn
  }

  health_check_configuration {
    protocol            = "HTTP"
    path                = "/health"
    interval            = 10
    timeout             = 5
    healthy_threshold   = 1
    unhealthy_threshold = 5
  }

  tags = {
    Project     = "mathitude"
    Environment = var.environment
  }
}
