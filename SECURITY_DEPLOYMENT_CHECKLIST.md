# Security & Deployment Checklist

Before real resident information is entered:

1. Approved hosting and HTTPS are active.
2. Central PostgreSQL database is provisioned with encrypted connections.
3. Individual staff accounts and roles are approved; no shared application login.
4. Password policy, recovery process and MFA policy are approved.
5. Server-side authorization is tested for every staff role.
6. Secure/HttpOnly/SameSite session cookies, CSRF protection, rate limiting and session timeout are enabled.
7. Private file storage is configured; uploads are type/size checked and malware scanned.
8. Audit logging is append-only and restricted.
9. Backups are encrypted, scheduled and restoration-tested.
10. Privacy, retention, deletion and incident procedures are approved.
11. Public tracking returns only resident-safe fields.
12. Production rollback has been tested.

The browser training workspace is never a production data store.

## V160 backend deployment checks
- [ ] `DATABASE_URL` points to a non-public production PostgreSQL service account with least privilege.
- [ ] `PUBLIC_ORIGIN` is the HTTPS production origin.
- [ ] Secure S3-compatible private storage credentials are configured outside the web root.
- [ ] `UPLOADS_ENABLED` remains false until document-storage controls are approved.
- [ ] Database migrations completed successfully.
- [ ] Bootstrap Manager password removed from runtime environment/history after account creation.
- [ ] Every staff member uses an individual account.
- [ ] `/api/health/readiness` reports ready only after infrastructure checks pass.
- [ ] Public enquiry returns a central `SMG-YYYY-######` reference.
- [ ] Tracker rejects reference-only lookups and requires matching contact information.
- [ ] Backup/restore drill completed before real resident migration.

## Upload malware scanning
- If document uploads are enabled, provision a ClamAV-compatible scanner reachable only from the application environment.
- Keep `MALWARE_SCAN_REQUIRED=true` in production.
- Do not enable uploads until both private object storage and malware scanning pass readiness checks.

## V162 HTTP and release hardening
- Confirm staff pages return `Cache-Control: no-store, private` and `X-Robots-Tag: noindex, nofollow, noarchive`.
- Confirm API responses are non-cacheable.
- Confirm every response has an `X-Request-Id` for operational tracing.
- Confirm `/robots.txt` disallows `/staff/` and `/api/`.
- Confirm the reverse proxy forwards HTTPS and a stable Host header.
- Confirm production and staging use different cookies, databases, secrets and storage credentials.
