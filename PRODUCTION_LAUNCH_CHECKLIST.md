# Production Launch Checklist — V162

This checklist is a release gate. A checked box should correspond to evidence, not an assumption.

## Infrastructure
- [ ] Production PostgreSQL exists and is reachable only from approved application/network paths.
- [ ] All migrations have completed successfully.
- [ ] `PUBLIC_ORIGIN` is the final HTTPS origin.
- [ ] TLS/HTTPS is valid and HTTP redirects to HTTPS.
- [ ] Production secrets are outside source control and differ from staging.
- [ ] Private object storage is configured before document uploads are enabled.
- [ ] Malware scanning is configured when production uploads are enabled.

## Identity and access
- [ ] Named Manager account created.
- [ ] Every production staff user has an individual account.
- [ ] Shared credentials are prohibited.
- [ ] Role assignments have been reviewed by management.
- [ ] Disabled/expired staff accounts have been removed or disabled.
- [ ] Session expiry, logout and session revocation have been tested.

## Data and migration
- [ ] Source registers are frozen for migration.
- [ ] Migration files have passed duplicate/data-quality review.
- [ ] Imported totals reconcile with signed source totals.
- [ ] Sensitive files are in private storage, not public directories.
- [ ] Public tracker exposes only approved public-safe fields.

## Verification
- [ ] `npm run qa` passes in the production environment.
- [ ] `npm run smoke` passes against staging.
- [ ] Authenticated smoke test passes with a dedicated test account.
- [ ] `python tools/release_qa.py` passes.
- [ ] Backup has been created immediately before launch.
- [ ] A backup has been restored successfully into a disposable verification database.
- [ ] Mobile and desktop UAT have been signed off.
- [ ] Public enquiry → reference → staff case → public tracker flow has been tested end to end.

## Launch and rollback
- [ ] Named launch lead is present.
- [ ] Rollback package and database restore instructions are available.
- [ ] Monitoring is active before public traffic is switched.
- [ ] Post-launch smoke test is completed immediately after deployment.
- [ ] Staff know how to report an incident and stop data entry if integrity is in doubt.
