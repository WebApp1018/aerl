#explanation 

Deployed on Fly, we have a multi-monolith instance of Mimir utilising a Redis cache and R2 as block storage. This is our core time-series database in which we store telemetry gathered from hub devices.

# Consul Service Discovery
A few options are available for Mimir services discovery, but Consul is the only practical solution when deployed on Fly. DNS round-robin doesn't work as expected due to Fly's anycast proxy which makes Memberlist not work correctly.

Fly [provides managed consul](https://fly.io/docs/flyctl/consul/) instances at no cost. The only non-standard configuration that needs to be added is a custom `prefix` (to match the one provided to us by Fly) and a custom `instance_addr` to bypass the anycast proxy for direct container-container communication.

The `kvstore` configuration for each micro-service looks something like this:

```yaml
ruler:
  ring:
    kvstore:
      store: consul
      prefix: ${CONSUL_PREFIX}
      consul:
        host: ${CONSUL_URL}
        acl_token: ${CONSUL_TOKEN}
        instance_addr: "${FLY_ALLOC_ID}.vm.${FLY_APP_NAME}.internal"
```

# Redis Cache
The query frontend, index store, chunks store, and metadata store all use a single Redis cache to reduce the time it takes to look up data for their various roles. Since we are already deployed on Fly, going with a managed Redis instance by Upstash was the easiest solution.

The cache configuration looks something like this:

```yaml
results_cache:
  redis:
    endpoint: fly-redis-aerl-cloud.upstash.io:6379
      username: default
      password: ${REDIS_PASSWORD}
```

# Storage Backend
For our storage backend we use S3 compatible Cloudflare R2 since we are already using Cloudflare Pages. 

## S3 vs R2 Pricing
As shown below, the cost to store data is $0.002 per GB higher for R2, but the cost for both classes of requests is lower, especially given the first 10 million Class A and first 1 million Class B requests are free. This is especially important as Mimir needs to access the data frequently.

| | S3 | R2 |
|---|---|---|
| Storage / Month | $0.025 per GB | $0.023 per GB |
| Class A Request (PUT, POST, LIST) | $0.0055 per 1,000 | $0.004 per 1,000 |
| Class B Request (GET, SELECT) | $0.00044 per 1,000 | $0.00036 per 1,000 |
| Transfer TB / Month | $0.09 per GB | $0.00 per GB |

Prices in USD.

# Multi-tenancy
As explained in our security model, we don't want organisations accessing someone else's data. We could do all of the querying server side and enforce some label matching, but the better way is to use the multi-tenancy built into Mimir. This uses a header to route request to the correct tenancy.

# Alerting and Rules
Rather than building our own ruler engine, continuously querying Mimir evaluating alerts, we hook into the built-in ruler settings it's configuration declaratively from the Supabase database.

Triggered by changes to rows in the `alert_rule` table, there is a service to configure Mimir's ruler via the management API. This service essentially takes the content of the rows, verifies it, and formats it into the expected YAML structure. This must be done tenant by tenant.

# References
- [Grafana Mimir](https://grafana.com/oss/mimir/)
- [Configuration Parameters](https://grafana.com/docs/mimir/latest/references/configuration-parameters/)
