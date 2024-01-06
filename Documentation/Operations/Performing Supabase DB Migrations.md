#how-to 
# Process

1. Make local changes as required.
2. Create the new migration `supabase db diff | supabase migration new <migration name>`.
3. Commit the new migration file to Git and push to the repo.
4. Run `supabase db push` to apply the migration to production.

