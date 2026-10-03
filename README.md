# Scarborough / Mt. Grace District Office Service System — V249

**Current status: controlled pre-launch / staging candidate**

V249 extends the V242–V248 release-control modernization into the everyday staff workspace. The Staff System Directory, Daily Workboard and System Administration now use the current authenticated production shell and live server-backed information instead of the older V159-era navigation pattern.

## Current staff entry points

- Staff sign-in: `/staff/login.html`
- Staff home / case management: `/staff/index.html`
- Staff System Directory: `/staff/sections.html`
- Daily Workboard: `/staff/workflow.html`
- Applications & Referrals: `/staff/applications.html`
- Records Centre: `/staff/records.html`
- Reports: `/staff/reports.html`
- Access Control: `/staff/access.html`
- System Administration: `/staff/system.html`
- Website CMS: `/staff/cms.html`
- Publishing Desk: `/staff/publishing.html`
- Publishing QA: `/staff/publishing-qa.html`
- Production Control: `/staff/production.html`
- Release Control: `/staff/readiness.html`
- Go-Live & Migration: `/staff/go-live.html`

Public/resident entry points:
- Public website: `/`
- Resident tracker: `/track/`
- Resident portal hub: `/portals/`

Health endpoints:
- Liveness: `/api/health/live`
- Health: `/api/health`
- Readiness: `/api/health/readiness`

## V249 staff-workspace improvements

### Staff System Directory
The old V160/V159 directory shell is replaced with a current system map organized around:
- resident operations
- community operations
- records and management intelligence
- public website/publishing
- administration and release controls

### Daily Workboard
`/staff/workflow.html` now reads the live management summary API and displays:
- open cases
- overdue case follow-ups
- open applications
- open field activity
- records awaiting review

It remains a read-only routing surface. Staff edit authoritative records inside the relevant case/application/field/records modules instead of creating duplicate workboard state.

### System Administration
`/staff/system.html` now reads:
- liveness
- database health
- expanded server readiness
- publishing integrity

Detailed release decisions remain in Production Control and Release Control.

### Backend release identity
The server package version is now `249.0.0`, so `/api/health/live` reports the current build family rather than the obsolete V163 package identity.

## Controlled publishing and release

The V242–V248 controls remain in place:
- governed Draft → In Review → Approved → Published workflow
- verification before publishing
- stable public snapshots during controlled revisions
- Publishing QA and integrity diagnostics
- expanded server/environment readiness
- separate administrative evidence gates
- local-only migration CSV staging
- explicit production authorization boundary

## Technical release verification

Run from `server/`:

- `npm run check`
- `npm test`
- `npm run preflight`
- `npm run qa`
- `npm run smoke`
- `npm run migrate`

Package-level static QA:
- `python tools/release_qa.py`

Smoke coverage now includes the Staff Directory, Daily Workboard, System Administration, Production Control, Publishing Desk, Publishing QA, Release Control and Go-Live surfaces.

## Production boundary

Green technical checks and completed browser evidence do **not** authorize production.

Before confidential resident data or public production launch, the office still requires documented review/approval of hosting, DNS/TLS, secrets, staff access, privacy/retention, private storage, backup/restore, incident/rollback procedures, migration reconciliation, UAT/pilot, monitoring and THA IT / management authorization.

See `PRODUCTION_LAUNCH_CHECKLIST.md` for the detailed evidence checklist.

## Data rule until authorization

Use synthetic/test data in staging until the required production review is complete. A healthy server, completed checklist, clean migration CSV or successful deployment must not be interpreted as permission to migrate confidential resident records.
