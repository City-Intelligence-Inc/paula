# Mathitude uploads bucket (F-1/F-2) — standalone module with its own state,
# deliberately separate from the legacy stack in ../ (which manages App
# Runner/DynamoDB/Vercel and has no local state; applying it blind could
# fight live resources).
#
# The app never exposes this bucket to browsers directly: uploads go through
# short-lived presigned PUTs minted by /api/files/presign, downloads are
# streamed through /api/files/object. Public access is fully blocked.
#
# Apply:  terraform init && terraform apply
# Then:   set FILES_S3_BUCKET=<output bucket_name> in Vercel (all envs).

terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }
}

variable "aws_region" {
  description = "Region the app's other AWS resources (DynamoDB) live in."
  type        = string
  default     = "us-west-2"
}

variable "bucket_name" {
  description = "Globally-unique uploads bucket name."
  type        = string
  default     = "mathitude-files-050451400186"
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project   = "mathitude"
      Purpose   = "student-file-sharing"
      ManagedBy = "terraform"
    }
  }
}

resource "aws_s3_bucket" "files" {
  bucket = var.bucket_name
}

# Nothing in this bucket is ever public — reads are streamed by the server.
resource "aws_s3_bucket_public_access_block" "files" {
  bucket                  = aws_s3_bucket.files.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "files" {
  bucket = aws_s3_bucket.files.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Guard against accidental overwrites of a shared worksheet.
resource "aws_s3_bucket_versioning" "files" {
  bucket = aws_s3_bucket.files.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Browsers PUT directly to presigned URLs, so the bucket must allow the
# site's origins. GETs never come from the browser (server-streamed).
resource "aws_s3_bucket_cors_configuration" "files" {
  bucket = aws_s3_bucket.files.id

  cors_rule {
    allowed_methods = ["PUT"]
    allowed_origins = [
      "https://website-sage-three-98.vercel.app",
      "https://mathitude.com",
      "https://www.mathitude.com",
      "https://*.vercel.app", # preview deployments
      "http://localhost:3000",
    ]
    allowed_headers = ["content-type"]
    max_age_seconds = 3600
  }
}

output "bucket_name" {
  value = aws_s3_bucket.files.bucket
}
