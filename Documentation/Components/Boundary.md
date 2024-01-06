#explanation 

Boundary is at the [edge](https://fly.io/docs/reference/regions/) serving requests from both users and devices. It functionally provides the utility of a reverse proxy, but with complete programability (it's just another Rust binary).

# Prometheus Query API Wrapper
Rather than defining pre-set queries which clients can call, we allow any query and just scope it to the tenancies the user has access to. This is similar to the row level security we have for PostgREST, but far less granular.

The endpoints are called as if they were a Supabase Edge Function and the authentication tokens are passed through to the PostgREST request which gathers the list of organisations the user has access to.

The following endpoints are passed through to Mimir with the correct `X-Scope-Org-Id` header:
- `/prometheus/api/v1/query`
- `/prometheus/api/v1/query_range`
- `/prometheus/api/v1/series`
- `/prometheus/api/v1/labels`

# Better Uptime API Wrapper
Rather than having separate mechanisms for showing ongoing incidents in the application vs. on the status page, we wrap the BetterUptime API. 