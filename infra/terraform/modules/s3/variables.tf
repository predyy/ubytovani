variable "aws_region" {
  type = string
}

variable "env" {
  type = string
}

variable "allowed_origins" {
  type = list(string)
  default = [
    "http://localhost.local:3000",
    "http://app.localhost.local:3000",
    "https://app.your-platform-domain.tld",
    "https://tenant.your-platform-domain.tld",
  ]
}
