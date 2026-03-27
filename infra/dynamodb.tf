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
