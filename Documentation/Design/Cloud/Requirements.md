#explanation #reference 

# Functional

1. Telemetry.
    - Time-series data shall be ingested, processed, recorded and made available to be queried in a timely manor.
2. Alerting/Events.
    - The platform shall provide dynamic configuration of telemetry queries that produce events which can be used to drive notifications and other actions.
3. Authentication and authorization.
    - Endpoints and users alike shall only have access to read and write data they are permitted to by security policies.
4. Asset management.
    - A database of assets shall track relationships between devices and between users and device.
5. Realtime command and control.
    - Configuration changes shall be streamed to endpoints rather than relying on polling to communicate changes.

# Performance

1. Telemetry data shall be stored for the life of the device.
    - Even if it has no value to the user, long-term historical data.
    - The data may be down-sampled after an appropriate period of time.
2. Horizontal scalability
    - Cloud services must be able to scale horizontally to a reasonably degree without causing a drop in quality of service due to bottlenecking.
2. Redundancy
    - Cloud service must be deployed in a redundant configuration where failure of any single instance does not negatively effect other instance or cause a measurable drop in quality of service.

# Interface

1. Hub/device API.
2. Private application API.
2. Public API for 3rd party integrations.

# Operational

1. Service monitoring
    - Internal services shall be monitored for availability and shall export metrics for analysis on performance and quality of service.

# Safety

1. Data corruption prevention.
    - Services should be designed to prefer loss of availability over data corruption.
