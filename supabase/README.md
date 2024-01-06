# Supabase

## How to

## Publish Environment Variables

```shell
supabase secrets set --env-file ./supabase/.env
# or
supabase secrets set MY_NAME=Chewbacca
```

## Generate TypeScript types from the database schema

```shell
supabase gen types typescript --project-id "mzynufuthvghqanlkluf" --schema public > functions/_shared/types.gen.ts
```

## Local Environment Urls

- [http://localhost:54323]() Supabase Studio
- [http://localhost:54324]() Inbucket
