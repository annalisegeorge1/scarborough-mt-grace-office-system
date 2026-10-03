# Scarborough / Mt. Grace District Office Service System — V248

**Current status: controlled pre-launch / staging candidate**

V248 completes the modernization of the core release-control surfaces introduced across V242–V247. Production Control, Publishing QA, Release Control and Go-Live now present a consistent operational model: live technical evidence is visible, migration preparation is separated from production import, and formal authorization remains a distinct THA IT / management decision.

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

## What V242–V248 added

### Controlled public publishing
The CMS has a governed publishing path with Draft, In Review, Approved, Published, revision, archive and restore behavior. Stable public snapshots remain available while staff work on controlled revisions.

### Publishing QA
`/staff/publishing-qa.html` verifies the deployed publishing migration, required schema, revision parity, stable public snapshots, public-document controls and malformed legacy snapshot document identifiers.

### Release Control
`/staff/readiness.html` combines live server readiness, expanded security/environment policy checks, publishing integrity and a separate twelve-gate administrative evidence checklist.

### Production Control
`/staff/production.html` is the operational release hub. It surfaces application, database, storage, server-readiness and publishing-integrity state and routes staff to operations, publishing, UAT, pilot and go-live controls.

### Go-Live & Migration
`/staff/go-live.html` combines live release evidence with the existing local-only CSV staging workflow. Selected CSV files are parsed in the browser for mapping and validation; the page does not perform a production database import.

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

Green technical checks and completed browser evidence are necessary but do **not** authorize production.

Before real resident data or public production launch, document and approve:
- hosting ownership and support responsibility
- final DNS, domain and TLS/HTTPS state
- production secrets and account ownership
- individual staff roles and access
- privacy, retention and records handling
- private document storage
- backup schedule and successful restore test
- incident/rollback procedure
- migration reconciliation
- mobile/desktop UAT and pilot sign-off
- monitoring and post-deployment smoke testing
- THA IT / management authorization

See `PRODUCTION_LAUNCH_CHECKLIST.md` for the detailed evidence checklist.

## Historical deployment baseline

The earlier V163 Render + Supabase staging documents remain useful provider-setup history:
- `V163_STAGING_DEPLOYMENT.md`
- `V163_READINESS_CHECKLIST.md`

They are not the current release-state summary. V248 and the live control surfaces above are the current reference points.

## Data rule until authorization

Use synthetic/test data in staging until the required production review is complete. A healthy server, completed checklist, clean migration CSV or successful deployment must not be interpreted as permission to migrate confidential resident records.
