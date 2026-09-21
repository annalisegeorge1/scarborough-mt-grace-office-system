# Backup & Recovery Baseline

- Database: encrypted daily backup plus point-in-time recovery where supported.
- Documents: versioned private object storage and independent backup where required.
- Configuration/secrets: managed secret store; do not place production secrets in ZIPs or source files.
- Retention: approve a schedule appropriate to office policy and legal requirements.
- Restore test: perform and document a restoration test before go-live and periodically thereafter.
- Recovery record: record date, operator, backup used, systems restored, validation result and unresolved issues.

## V162 restore verification
A backup is not considered verified merely because the backup command completed. Restore it into a disposable non-production database and inspect core row counts plus application smoke tests. V162 includes `server/scripts/verify-backup.sh` for this purpose. Never point its `TEST_DATABASE_URL` at production.
