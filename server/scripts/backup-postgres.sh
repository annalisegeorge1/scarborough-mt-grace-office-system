#!/bin/sh
set -eu
: "${DATABASE_URL:?DATABASE_URL is required}"
OUT="${1:-smg-backup-$(date -u +%Y%m%dT%H%M%SZ).dump}"
umask 077
pg_dump --format=custom --no-owner --no-privileges "$DATABASE_URL" > "$OUT"
echo "Backup written to $OUT"
