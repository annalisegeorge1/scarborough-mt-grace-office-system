#!/usr/bin/env sh
set -eu
if [ "${1:-}" = "" ]; then echo "Usage: TEST_DATABASE_URL=... $0 /path/to/backup.sql[.gz]"; exit 2; fi
if [ "${TEST_DATABASE_URL:-}" = "" ]; then echo "TEST_DATABASE_URL is required. Never point this at production."; exit 2; fi
case "$TEST_DATABASE_URL" in *prod*|*production*) echo "Refusing a TEST_DATABASE_URL that appears to be production."; exit 3;; esac
backup="$1"
[ -f "$backup" ] || { echo "Backup not found: $backup"; exit 2; }
echo "Restoring into disposable verification database target..."
if echo "$backup" | grep -q '\.gz$'; then gzip -dc "$backup" | psql "$TEST_DATABASE_URL" -v ON_ERROR_STOP=1; else psql "$TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -f "$backup"; fi
psql "$TEST_DATABASE_URL" -v ON_ERROR_STOP=1 <<'SQL'
SELECT 'users' AS table_name, count(*) AS rows FROM users
UNION ALL SELECT 'cases', count(*) FROM cases
UNION ALL SELECT 'applications', count(*) FROM applications
UNION ALL SELECT 'audit_log', count(*) FROM audit_log;
SQL
echo "Backup restore verification completed. Review row counts and application smoke tests before accepting the backup." 
