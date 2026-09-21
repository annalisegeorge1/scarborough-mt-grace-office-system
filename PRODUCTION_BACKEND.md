# Production Backend — V160

V160 introduces executable server-side infrastructure for the Scarborough / Mt. Grace District Office service system.

## Production boundaries
The backend is for non-partisan district-office service administration. It must not be extended with voter preference, political affiliation, persuasion, electoral targeting or campaign-mobilization data.

## Core services
- Node.js 20+ / Express application server.
- PostgreSQL as the authoritative shared data store.
- Opaque server-side sessions stored in PostgreSQL.
- Password hashing with Node's `scrypt` implementation.
- CSRF tokens for authenticated state-changing requests.
- Role-based authorization enforced on the server.
- Append-only audit events for security and record changes.
- Public enquiry intake and restricted resident tracking.
- Core APIs for cases, applications, records, feedback, content, audit and global search.
- Private file-storage abstraction. Local storage is intentionally blocked in production unless explicitly enabled; a managed private object store should be configured before real document uploads.

## First deployment sequence
1. Provision a managed PostgreSQL database and a managed private object-storage service.
2. Copy `server/.env.example` to a protected runtime `.env` and replace every placeholder.
3. Install Node.js dependencies in `server/`.
4. Run `npm run migrate`.
5. Set the bootstrap administrator environment variables and run `npm run seed:admin` once; then remove the bootstrap password from the environment/history.
6. Start the server behind HTTPS/reverse proxy and verify `/api/health` and `/api/health/readiness`.
7. Sign in with the named Manager account, create named staff accounts and verify roles.
8. Complete UAT, backup/restore test, privacy review and pilot gates before migration of real resident records.

## Non-negotiable production checks
- HTTPS only.
- Database is not exposed publicly.
- Individual staff accounts only.
- Secure/private file storage configured.
- Backups encrypted and restore-tested.
- Public tracker exposes only approved fields.
- Logs and audit events do not contain passwords, session tokens or uploaded-file contents.
- Staff modules still using training/local browser stores must not be treated as authoritative until their API integration is completed.
