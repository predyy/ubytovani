terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.81.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.4.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.2.0"
    }
    docker = {
      source  = "kreuzwerker/docker"
      version = "~> 3.0.2"
    }
    local = {
      source  = "hashicorp/local"
      version = "2.4.0"
    }
    time = {
      source  = "hashicorp/time"
      version = "0.9.1"
    }
  }

  backend "s3" {
    key                     = "ubytovani-dev-terraform-state"
    region                  = "eu-central-1"
    shared_credentials_file = "~/.aws/credentials"
  }
}

provider "aws" {
  region  = var.aws_region
  profile = var.terraform_iam_user
}

module "s3" {
  source     = "./modules/s3"
  env        = var.env
  aws_region = var.aws_region
}
