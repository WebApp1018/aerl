terraform {
  required_providers {
    jetstream = {
      source  = "nats-io/jetstream"
      version = "0.0.35"
    }
  }
}

provider "jetstream" {
  servers = "localhost:4222"
}

module "main" {
  source = "../modules/main"
}
