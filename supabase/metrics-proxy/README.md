# Fly Supabase Metrics Proxy

Supabase provides a Prometheus-compatible metrics endpoint which can be accessed using the `service_role` token. Documentation for this can be found [here](https://supabase.com/docs/guides/platform/metrics).

This Fly app uses NGINX to proxy requests from the endpoint `/metrics` to the corresponding Supabase API endpoint, adding the required auth headers. With Fly configured to scrape the private metrics endpoint, it is actually scraping the authenticated Supabase endpoint giving us long-term storage of the metrics.
