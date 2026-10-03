# Scarborough / Mt. Grace District Office Service System — V247

**Current status: controlled pre-launch / staging candidate**

V247 aligns the repository documentation and Production Control surface with the actual V242–V246 publishing, readiness and release-control work. The system must **not** be treated as production-authorized merely because technical checks pass.

## Current control surfaces

- Public website: `/`
- Resident tracker: `/track/`
- Resident portal hub: `/portals/`
- Staff sign-in: `/staff/login.html`
- Staff home / case management: `/staff/index.html`
- Website CMS: `/staff/cms.html`
- Publishing Desk: `/staff/publishing.html`
- Publishing QA: `/staff/publishing-qa.html`
- Release Control: `/staff/readiness.html`
- Production Control: `/staff/production.html`
- Go-Live & Migration: `/staff/go-live.html`
- Liveness: `/api/health/live`
- Health: `/api/health`
- Readiness: `/api/health/readiness`

## What V242–V247 added

### Controlled public publishing
The CMS now has a governed publishing path with Draft, In Review, Approved, Published, revision, archive and restore behavior. Publishing preserves stable public snapshots while staff revise approved content.

### Publishing QA
`/staff/publishing-qa.html` verifies the deployed publishing migration, required schema, revision parity, stable public snapshots, public-document controls and malformed legacy snapshot document identifiers.

### Live Release Control
`/staff/readiness.html` combines:
- live server readiness
- expanded security/environment policy checks
- publishing integrity
- a separate twelve-gate administrative evidence checklist

The administrative checklist is evidence tracking only. It does not configure infrastructure or grant production approval.

### Production Control
`/staff/production.html` is the operational release hub. It surfaces application, database, storage, server-readiness and publishing-integrity state and links staff directly to operations, publishing, UAT, pilot and go-live controls.

## Technical release verification

Run from `server/`:

- `npm run check` — JavaScript syntax validation
- `npm test` — backend automated tests
- `npm run preflight` — environment/package policy checks
- `npm run qa` — check + tests + preflight
- `npm run smoke` — live endpoint and protected-route smoke checks
- `npm run migrate` — apply database migrations

Package-level static QA:
- `python tools/release_qa.py`

## Required production boundary

A green API, green Publishing QA and a completed Release Control checklist are **necessary evidence, not authorization**.

Before real resident data or public production launch, the office still requires documented review of:
- hosting ownership and support responsibility
- final DNS, domain and TLS/HTTPS state
- production secrets and account ownership
- staff roles and individual accounts
- privacy, retention and records handling
- private document storage
- backup schedule and successful restore test
- incident/rollback procedure
- migration reconciliation
- mobile/desktop UAT and pilot sign-off
- post-deployment monitoring and smoke testing
- THA IT / management authorization

See `PRODUCTION_LAUNCH_CHECKLIST.md` for the evidence checklist.

## Historical deployment baseline

The earlier V163 zero-cost Render + Supabase staging guidance remains useful as provider setup history, including:
- `V163_STAGING_DEPLOYMENT.md`
- `V163_READINESS_CHECKLIST.md`

Those documents are not the current release-status summary. V247 and the live Release Control surfaces are the current reference points.

## Data rule until authorization

Use synthetic/test data in staging until the required production review is complete. Do not interpret browser checkboxes, a healthy server, or a successful deployment as permission to migrate confidential resident records.
