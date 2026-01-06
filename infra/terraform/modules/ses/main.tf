locals {
  from_email = trimspace(var.from_email)
  domain     = trimspace(var.domain)
}

resource "aws_sesv2_email_identity" "from_email" {
  count          = local.from_email != "" ? 1 : 0
  email_identity = local.from_email
}

resource "aws_sesv2_email_identity" "domain" {
  count          = local.domain != "" ? 1 : 0
  email_identity = local.domain
}
