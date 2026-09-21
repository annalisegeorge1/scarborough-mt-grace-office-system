# Deployment Runbook — V160

## Before deployment
- Complete the production environment variables and keep `.env` out of the website directory and version-control exports.
- Provision PostgreSQL and private object storage.
- Confirm DNS and TLS for `scarboroughmtgrace.page`.
- Take a backup/snapshot before every application or schema deployment.
- Run JavaScript syntax checks and UAT.

## Deploy
- Install production Node dependencies.
- Run database migrations once.
- Start the application process under a managed process/container service.
- Route HTTPS traffic to the application port.
- Do not separately expose the `server/` directory.

## Smoke test
- `GET /api/health` returns HTTP 200.
- `GET /api/health/readiness` returns ready=true only after all required infrastructure is configured.
- Staff sign-in works over HTTPS.
- Public enquiry creates one central SMG reference.
- Tracker requires matching reference + contact.
- Case update persists across a second browser/device.
- Unauthorized users cannot call protected APIs.
- A logout invalidates the session.
- Audit events exist for sign-in and record changes.

## Rollback
- Stop the new application revision.
- Restore the prior application revision.
- Roll back database changes only with a reviewed reverse migration or database restore; never manually delete production tables to "undo" a release.

## V162 release-candidate verification
Before a staging or production deployment:
1. Run `python tools/release_qa.py` from the package root.
2. In `server/`, run `NODE_ENV=production ... npm run qa` with the target environment values loaded.
3. Apply migrations to staging.
4. Start the staging service and run `SMOKE_BASE_URL=https://staging... npm run smoke`.
5. Repeat the smoke test with a dedicated staging staff account via `SMOKE_EMAIL` and `SMOKE_PASSWORD`.
6. Verify a current PostgreSQL backup can be restored into a disposable database with `scripts/verify-backup.sh`.
7. Complete `PRODUCTION_LAUNCH_CHECKLIST.md` before production cutover.
