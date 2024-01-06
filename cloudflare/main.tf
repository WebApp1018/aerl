terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "4.20.0"
    }
  }

  backend "s3" {
    endpoint                    = "https://4d940b8000140e116b8fccc826bea42b.r2.cloudflarestorage.com"
    force_path_style            = true
    bucket                      = "aerl-cloud-tfstate"
    key                         = "cloudflare"
    region                      = "us-east-1"
    skip_credentials_validation = true
  }
}

provider "cloudflare" {
}

locals {
  account_id     = "4d940b8000140e116b8fccc826bea42b"
  record_comment = "Managed by Terraform"

  frontend_ipv4 = "137.66.58.5"
  frontend_ipv6 = "2a09:8280:1::1c:41cc"
}

resource "cloudflare_zone" "cloud" {
  account_id = local.account_id
  zone       = "aerl.cloud"
}
