#reference 

[Supabase guide](https://supabase.com/docs/guides/auth/social-login/auth-azure)

# Publisher Domain Verification

Microsoft requires you to verify your domain by serving a `.json` file at a specific path.

For us the path is `https://aerl.cloud/.well-known/microsoft-identity-association.json`

We serve this via NextJS's middleware feature.
