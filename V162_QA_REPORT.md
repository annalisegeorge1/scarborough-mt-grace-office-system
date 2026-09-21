# V162 QA Report

The release candidate is validated from source/package level. External infrastructure checks remain pending until real staging/production services are provisioned.

## Passed locally
- Active HTML surfaces scanned for local broken links/assets.
- Staff pages scanned for duplicate IDs.
- Production homepage checked for embedded staff preview data.
- All backend JavaScript files passed `node --check`.
- Backend unit tests passed.
- Production preflight passed with a representative safe configuration (uploads disabled).
- ZIP integrity and checksums are generated at packaging time.

## Must be repeated in staging
- Database migration against a real PostgreSQL instance.
- Authenticated staff smoke test.
- Public enquiry and tracker end-to-end flow.
- Private upload/download with managed object storage and malware scanning if uploads are enabled.
- Backup restore verification into a disposable database.
- Mobile/desktop accessibility and workflow UAT.
