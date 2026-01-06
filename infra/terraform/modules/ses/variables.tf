variable "env" {
  type = string
}

variable "aws_region" {
  type = string
}

variable "from_email" {
  type    = string
  default = ""
}

variable "domain" {
  type    = string
  default = ""
}
