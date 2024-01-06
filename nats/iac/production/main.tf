terraform {
  required_providers {
    jetstream = {
      source  = "nats-io/jetstream"
      version = "0.0.35"
    }
  }

  backend "s3" {
    endpoint                    = "https://4d940b8000140e116b8fccc826bea42b.r2.cloudflarestorage.com"
    force_path_style            = true
    bucket                      = "aerl-cloud-tfstate"
    key                         = "nats"
    region                      = "us-east-1"
    skip_credentials_validation = true
  }
}

provider "jetstream" {
  servers = "localhost:4222"
}

module "main" {
  source = "../modules/main"
}
