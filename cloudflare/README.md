# Cloudflare IaC

Mainly DNS configuration managed by Terraform.

## Setup

Grab some R2 API credentials and export them as the following environment
variables.

```shell
export AWS_ACCESS_KEY_ID=
export AWS_SECRET_ACCESS_KEY=
```

Initialise terraform.

```shell
terraform init
```

## About the R2 state storage backend

Instead of using the typical S3 state storage, we store our state in S3
compatible R2 storage. Handy since we're configuring Cloudflare anyway.
