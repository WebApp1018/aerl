#reference

Generally environment variables for configuration and secrets that store the same thing across applications should be called the same thing.

Here are some common environment variables.

- `SUPABASE_URL` Supabase API URL.
- `SUPABASE_ANON_KEY` Supabase anonymous access JWT.
- `SUPABASE_SERVICE_ROLE_KEY` Supabase service role access JWT.
- `SUPABASE_DB_URL` Supabase Postgres database URL (not the same as the PostgREST endpoint).
- `MIMIR_URL` Mimir API endpoint including protocol and port.
- `NATS_URL` NATS API endpoint including protocol and port.

# Naming Custom Environment Variables
Services and applications should choose their environment variable names as if they were being referenced by a third party.

For example, a service named Stubby should prepend it's env vars with `STUBBY_`.
# References
- [Supabase Functions Default Secrets](https://supabase.com/docs/guides/functions/secrets#default-secrets)
- [Fly Runtime Environment Variables](https://fly.io/docs/reference/runtime-environment/#environment-variables)
