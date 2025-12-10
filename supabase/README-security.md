Supabase security notes and deployment steps

1) RLS for `subscriptions`
- A migration is included at `supabase/migrations/001_enable_subscriptions_rls.sql`.
- This enables row-level security and prevents client-side inserts/updates/deletes.
- Deployment:
  - Use the Supabase CLI to apply the migration, or paste the SQL into the SQL editor in the Supabase dashboard.
  - Example with supabase CLI:

    supabase db reset --project-ref <PROJECT_REF>
    supabase db push --project-ref <PROJECT_REF>

2) Service-side subscription mutations
- A new Edge Function `manage-subscription` is provided at `supabase/functions/manage-subscription/index.ts`.
- This function expects an Authorization header with the user's access token ("Bearer <user_token>") and will:
  - validate the token server-side
  - perform create/update/delete using the service role key
- Environment variables required for the function:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
- Deploy the function via the Supabase dashboard or CLI.

3) Linked password protection (Auth setting)
- The warning about "Linked password protection disabled" refers to a Supabase Auth setting that helps prevent account takeover when linking providers.
- To enable:
  - Go to Supabase dashboard -> Authentication -> Settings
  - Look for "Linked password protection" or provider linking protections and enable it.
  - If using the Supabase CLI or API, ensure the relevant setting is toggled in the project config.

4) Mapbox token
- The code now reads `VITE_MAPBOX_TOKEN` from environment variables.
- Add `VITE_MAPBOX_TOKEN` to your `.env` or project secrets in the deployment environment.

5) Next steps
- Review all client calls that modify `subscriptions` and route them through the `manage-subscription` function.
- Run security scans again after applying the migration and deploying the function.
