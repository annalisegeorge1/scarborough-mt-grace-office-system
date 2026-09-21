# Scarborough / Mt. Grace District Office — V163

**Zero-Cost Staging Deployment Candidate: Render + Supabase**

V163 builds on V162 and prepares the system for the first real cloud staging deployment without requiring a hosting payment. It adds a Render Blueprint, Supabase/Render connection safeguards, provider-specific readiness checks, first-Manager bootstrap guidance, Cloudflare staging-domain instructions and a strict synthetic-data-only staging policy.

Start with `V163_STAGING_DEPLOYMENT.md` and `V163_READINESS_CHECKLIST.md`.

---

# Scarborough / Mt. Grace District Office Service System — V162

V162 is the **Production QA & Deployment Candidate** release. It preserves V161 functionality while adding deployment verification, environment separation, release QA and additional HTTP hardening.

The package contains the public district website, resident enquiry tracker, protected Staff Portal, Node.js/Express API, PostgreSQL migrations, server-side authentication and authorization, audit logging, private-storage integration, automation/reminder services, management reporting and deployment documentation.

## Production entry points
- Public site: `/`
- Resident tracker: `/track/`
- Staff sign-in: `/staff/login.html`
- Staff portal after authentication: `/staff/index.html`
- Health check: `/api/health`
- Readiness check: `/api/health/readiness`

`index-self-contained.html` is the production public page and does **not** embed staff pages. `index-self-contained-demo.html` is retained only for package review/offline demonstration and must not be used as the production public page.

## Start here for deployment
1. Read `PRODUCTION_BACKEND.md`.
2. Configure `server/.env` from `.env.example` using real secrets outside source control.
3. Provision PostgreSQL.
4. Run `npm run migrate` inside `server/`.
5. Create the first Manager with `npm run seed:admin`.
6. Configure private object storage before enabling uploads.
7. Run backend tests and UAT.
8. Deploy through staging before production.

V161 remains the rollback baseline.


## V162 release verification
- Static package QA: `python tools/release_qa.py`
- Backend syntax/tests/preflight: `npm run qa` inside `server/`
- Live environment smoke test: `npm run smoke` inside `server/`
- Launch gate: `PRODUCTION_LAUNCH_CHECKLIST.md`
