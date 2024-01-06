#reference
# Terms

- SLI - Service Level Indicator
- SLO - Service Level Objective
- SLA - Service Level Agreement (see [Service Level Agreement](./Service Level Agreement.md))
- p95 - 95th Percentile

# Measurement

Where possible, service level indindicators are to be recorded as Prometheus metrics made available to Fly Metrics for alerting and later analysis.

# Error Budgeting

Experience shows that a target of 100% reliablilty is not a reasonable goal. Therefore some amount of acceptable downtime must be decided upon. This threshold should not be crossed under normal operation.

Some qualaties of service are an exception to this. Particularly in the space of data storage and resiliency.

# Objectives

Each objective has one or more service level indicators. These are listed as sub-tiems under the top level list below.

- User interfaces are responsive.
    - p95 latency of 1 second.
    - p99 latency of  5 seconds.
- Telemetry queries are responsive.
    - For time ranges up to 48 hours:
        - p95 latencty of 0.5 seconds
        - p99 latency of 3 seconds
    - For time ranges up to a month:
        - p95 latency of 2 seconds
        - p99 latency of 5 seconds
    - For time ranges up to a year:
        - p95 latency of 5 seconds
        - p99 latency of 8 seconds
    - For time ranges over a year:
        - p95 latency of 10 seconds
        - p99 latency of 15 seconds
- Telemetry queries are highly available
    - p95 success rate
