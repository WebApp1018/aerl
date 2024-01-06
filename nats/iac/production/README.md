# NATS Cluster IaC

## Setup

Grab some R2 API credentials and export them as the following environment
variables.

```shell
export AWS_ACCESS_KEY_ID=
export AWS_SECRET_ACCESS_KEY=
```

Create a wiregurd proxy to the NATS cluster with flyctl

```shell
fly proxy 4222:4222 nats-aerl-cloud.internal
```
