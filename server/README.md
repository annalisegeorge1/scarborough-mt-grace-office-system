# Server

This directory contains the executable V160 backend.

Typical deployment commands:

```text
npm install
npm run migrate
npm run seed:admin
npm test
npm start
```

Never commit a populated `.env`, database dump, private document, session token or bootstrap password into the public website package/repository.

The application serves the public self-contained site, `/staff/`, `/track/` and `/api/` from one origin. The `/server/` path is explicitly blocked from web access.

## V163 Render + Supabase staging

Use the repository-root `render.yaml` with a Supabase Session pooler `DATABASE_URL` (port 5432). Render is IPv4-only, so do not use the default Supabase direct IPv6 endpoint. `npm run provider:check` validates the key provider assumptions without printing the database password.
