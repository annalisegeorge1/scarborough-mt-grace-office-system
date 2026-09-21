# Go-Live Runbook

## Purpose
Controlled transition from training preview to production operation.

## 1. Freeze and backup
- Freeze changes to source spreadsheets/registers.
- Create a dated read-only copy of each source file.
- Verify production database backup/restore before import.

## 2. Accounts and permissions
- Create individual staff accounts.
- Verify role-based permissions and disable shared credentials.
- Confirm session timeout and audit logging.

## 3. Data migration
- Stage CSV files in the Go-Live Centre.
- Map required columns and validate.
- Resolve missing names/references and duplicate references.
- Export a clean migration package.
- Production import must occur through the secured server, not browser storage.

## 4. Cutover
- Import validated records.
- Record imported/rejected totals.
- Reconcile totals against source registers.
- Spot-check tracking references, case ownership and public-safe status fields.

## 5. Verification
- Test public enquiry creation and tracking.
- Test staff sign-in and role restrictions.
- Test documents, reports, CMS publication, appointments and community matters.
- Review audit events and backup status.

## 6. Rollback
If critical controls fail, stop production entry, restore the previous stable deployment/database backup and preserve all cutover logs for review.
