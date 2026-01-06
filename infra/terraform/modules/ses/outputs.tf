output "from_email_identity_arn" {
  value = try(aws_sesv2_email_identity.from_email[0].arn, null)
}

output "domain_identity_arn" {
  value = try(aws_sesv2_email_identity.domain[0].arn, null)
}

output "domain_dkim_tokens" {
  value = try(aws_sesv2_email_identity.domain[0].dkim_signing_attributes[0].tokens, [])
}
