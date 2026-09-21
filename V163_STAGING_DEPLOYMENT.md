# V163 Zero-Cost Staging Deployment

This release is prepared specifically for a no-cost staging deployment using:

- Render Free Web Service for the Node.js/Express application
- Supabase Free Postgres for the staging database
- Cloudflare DNS only after the generated Render URL has been proven healthy

This is a staging route, not a recommendation to keep confidential production data on free infrastructure indefinitely.

## Why this combination

Render can run the existing Node application without rewriting it and provides managed HTTPS. Its free web service is suitable for staging but spins down after inactivity and is explicitly described by Render as a preview/testing tier. Render's own free Postgres expires after 30 days, so V163 does not use Render Free Postgres.

Supabase Free provides a persistent Postgres project suitable for low-volume staging, but free projects can pause after inactivity and free projects do not provide the production backup guarantees required for final live use.

## Connection mode

Render is IPv4-only. Do not paste Supabase's direct IPv6 database endpoint into Render.

In Supabase:

1. Open the project.
2. Choose **Connect**.
3. Choose **Session pooler**.
4. Use the port **5432** connection string.
5. Percent-encode reserved characters in the database password if necessary.
6. Set `DATABASE_SSL=require` in Render.

V163 deliberately limits the Node PostgreSQL pool to 5 connections by default for small staging infrastructure.

## Deployment sequence

1. Create a Supabase Free project.
2. Save the database password securely.
3. Copy the Session pooler connection string.
4. Put the V163 files into a private Git repository.
5. In Render, create a Blueprint from the repository's root `render.yaml`.
6. Render will prompt for:
   - `DATABASE_URL`
   - `BOOTSTRAP_ADMIN_EMAIL`
   - `BOOTSTRAP_ADMIN_NAME`
   - `BOOTSTRAP_ADMIN_PASSWORD`
7. Use a unique password of at least 12 characters for the first Manager account.
8. The Blueprint runs database migrations before deployment.
9. On the initial deploy only, it creates/updates the first Manager account.
10. Confirm `/api/health/live` is healthy.
11. Sign in through `/staff/login.html`.
12. Remove `BOOTSTRAP_ADMIN_PASSWORD` from the Render environment after the first Manager login is confirmed.
13. Run the smoke test against the Render URL.
14. Only after staging is proven should a custom staging domain be added.

## Upload policy

`UPLOADS_ENABLED=false` is intentional. IDs, application evidence, site photographs and resident documents must not be collected in zero-cost staging until managed private storage and malware scanning are configured.

## Staging data policy

Use synthetic/test residents only. Do not place confidential resident records into this free staging environment.
