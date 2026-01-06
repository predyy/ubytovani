variable "env" {
  type    = string
  default = "dev"
}

variable "aws_region" {
  type    = string
  default = "eu-central-1"
}

variable "terraform_iam_user" {
  type = string
}

variable "ses_from_email" {
  type    = string
  default = ""
}

variable "ses_domain" {
  type    = string
  default = ""
}
