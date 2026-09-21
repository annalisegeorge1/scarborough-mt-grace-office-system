# V162 Production QA & Deployment Candidate

V162 intentionally adds very little functional scope. It hardens V161 into a cleaner deployment candidate.

## Added
- Request IDs on backend responses for incident tracing.
- No-store/no-cache headers for APIs and authenticated Staff Portal pages.
- `X-Robots-Tag` protection for staff content and a production `robots.txt` rule.
- Restrictive browser Permissions Policy for camera, microphone, geolocation, payment and USB.
- Dedicated `/api/health/live` liveness endpoint in addition to health/readiness.
- Staging and production environment templates.
- Separate staging and production Docker Compose examples.
- Production preflight command (`npm run preflight`).
- Live smoke-test command (`npm run smoke`).
- Backup restore verification helper using a disposable database.
- Static release QA tool for links, duplicate IDs, backend JS syntax and staff-preview leakage.
- Formal production launch checklist and staging/release process.

## Deployment boundary
The package cannot create real hosting accounts, PostgreSQL instances, DNS/TLS certificates, S3 credentials, or malware-scanner infrastructure by itself. Those external resources must be provisioned before confidential resident information is entered.
