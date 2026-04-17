# ---------------------------------------------------------
# DynamoDB tables for the Mathitude K-12 platform
# ---------------------------------------------------------

# ---- Students table ----

resource "aws_dynamodb_table" "students" {
  name         = "${var.table_prefix}-students"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "status"
    type = "S"
  }

  attribute {
    name = "lastName"
    type = "S"
  }

  global_secondary_index {
    name            = "by-status"
    hash_key        = "status"
    range_key       = "lastName"
    projection_type = "ALL"
  }

  tags = {
    Project = "mathitude"
  }
}

# ---- Sessions table ----

resource "aws_dynamodb_table" "sessions" {
  name         = "${var.table_prefix}-sessions"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "studentId"
  range_key    = "dateTime"

  attribute {
    name = "studentId"
    type = "S"
  }

  attribute {
    name = "dateTime"
    type = "S"
  }

  attribute {
    name = "date"
    type = "S"
  }

  attribute {
    name = "time"
    type = "S"
  }

  global_secondary_index {
    name            = "by-date"
    hash_key        = "date"
    range_key       = "time"
    projection_type = "ALL"
  }

  tags = {
    Project = "mathitude"
  }
}

# ---- Payments table ----

resource "aws_dynamodb_table" "payments" {
  name         = "${var.table_prefix}-payments"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "studentId"
  range_key    = "createdAt"

  attribute {
    name = "studentId"
    type = "S"
  }

  attribute {
    name = "createdAt"
    type = "S"
  }

  attribute {
    name = "paymentStatus"
    type = "S"
  }

  global_secondary_index {
    name            = "by-status"
    hash_key        = "paymentStatus"
    range_key       = "createdAt"
    projection_type = "ALL"
  }

  tags = {
    Project = "mathitude"
  }
}

# ---- Events table ----

resource "aws_dynamodb_table" "events" {
  name         = "${var.table_prefix}-events"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"
  range_key    = "date"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "date"
    type = "S"
  }

  attribute {
    name = "type"
    type = "S"
  }

  global_secondary_index {
    name            = "by-type"
    hash_key        = "type"
    range_key       = "date"
    projection_type = "ALL"
  }

  tags = {
    Project = "mathitude"
  }
}

# ---- Resources table ----

resource "aws_dynamodb_table" "resources" {
  name         = "${var.table_prefix}-resources"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "category"
  range_key    = "id"

  attribute {
    name = "category"
    type = "S"
  }

  attribute {
    name = "id"
    type = "S"
  }

  tags = {
    Project = "mathitude"
  }
}

# ---- Content table (CMS) ----

resource "aws_dynamodb_table" "content" {
  name         = "${var.table_prefix}-content"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "pageId"
  range_key    = "blockId"

  attribute {
    name = "pageId"
    type = "S"
  }

  attribute {
    name = "blockId"
    type = "S"
  }

  tags = {
    Project = "mathitude"
  }
}

# ---------------------------------------------------------
# v3.0 additions — see infra/SCHEMA.md
# Do not `terraform apply` until Sara signs off on SCHEMA.md.
# ---------------------------------------------------------

# ---- Families table ----

resource "aws_dynamodb_table" "families" {
  name         = "${var.table_prefix}-families"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  tags = {
    Project = "mathitude"
  }
}

# ---- Parents table ----

resource "aws_dynamodb_table" "parents" {
  name         = "${var.table_prefix}-parents"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "familyId"
    type = "S"
  }

  attribute {
    name = "lastName"
    type = "S"
  }

  attribute {
    name = "email"
    type = "S"
  }

  attribute {
    name = "stripeCustomerId"
    type = "S"
  }

  global_secondary_index {
    name            = "by-family"
    hash_key        = "familyId"
    range_key       = "lastName"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "by-email"
    hash_key        = "email"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "by-stripe-customer"
    hash_key        = "stripeCustomerId"
    projection_type = "ALL"
  }

  tags = {
    Project = "mathitude"
  }
}

# ---- Tutors table ----

resource "aws_dynamodb_table" "tutors" {
  name         = "${var.table_prefix}-tutors"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "clerkUserId"
    type = "S"
  }

  global_secondary_index {
    name            = "by-clerk-user"
    hash_key        = "clerkUserId"
    projection_type = "ALL"
  }

  tags = {
    Project = "mathitude"
  }
}

# ---- Users table (Clerk <-> role mapping) ----

resource "aws_dynamodb_table" "users" {
  name         = "${var.table_prefix}-users"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "clerkUserId"

  attribute {
    name = "clerkUserId"
    type = "S"
  }

  attribute {
    name = "role"
    type = "S"
  }

  attribute {
    name = "createdAt"
    type = "S"
  }

  global_secondary_index {
    name            = "by-role"
    hash_key        = "role"
    range_key       = "createdAt"
    projection_type = "ALL"
  }

  tags = {
    Project = "mathitude"
  }
}
