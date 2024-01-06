#explanation 

# Overview

We need to ensure that devices which make requests to our services are only devices we have authorised.

# Token Grant Flow

```mermaid
sequenceDiagram
  Device->>Auth Service: Request key with secret
  Auth Service->>Supabase: Check access key
  Supabase->>Auth Service: Response
  Auth Service->>Device: Grant token
```

# Auth Service

The auth service mints JWT tokens as needed by the devices. The tokens it mints have the `device` role allowing devices to interact with the Supabase API like users and other services.
