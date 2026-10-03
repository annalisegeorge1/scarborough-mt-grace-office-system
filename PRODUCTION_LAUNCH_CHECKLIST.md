# Production Launch Checklist — V247

This is an **evidence gate**, not an automatic authorization mechanism. Each checked item should point to verifiable evidence, an accountable owner and a date reviewed.

Use together with:
- `/staff/production.html` — live operational overview
- `/staff/publishing-qa.html` — publishing integrity
- `/staff/readiness.html` — combined technical + administrative Release Control
- `/staff/go-live.html` — controlled migration/cutover workspace

## 1. Hosting, domain and infrastructure

- [ ] Approved production hosting environment and account owner are documented.
- [ ] Production PostgreSQL is provisioned and reachable only through approved application/network paths.
- [ ] All required database migrations are recorded as applied.
- [ ] `PUBLIC_ORIGIN` is the final approved HTTPS origin.
- [ ] DNS and Cloudflare/origin routing are verified for the final domain.
- [ ] TLS certificate is valid and HTTP is redirected to HTTPS.
- [ ] Reverse-proxy/trust configuration matches the hosted environment.
- [ ] Production secrets are outside source control and differ from staging/test values.
- [ ] Private object storage is configured before confidential document uploads are enabled.
- [ ] Malware scanning is configured whenever production upload policy requires it.

## 2. Identity, access and sessions

- [ ] Named Manager account exists.
- [ ] Every production staff user has an individual account.
- [ ] Shared staff credentials are prohibited.
- [ ] Role assignments and permissions have been reviewed by management.
- [ ] Protected staff routes reject unauthenticated access.
- [ ] Disabled/expired accounts have been disabled or removed.
- [ ] Login, logout, session expiry and session revocation have been tested.
- [ ] CSRF protection has been tested on state-changing staff actions.
- [ ] Idle and absolute session limits match approved production policy.

## 3. Publishing and public exposure

- [ ] `/staff/publishing-qa.html` reports no publishing blockers.
- [ ] Publishing workflow migration and required columns are present.
- [ ] Revision history parity passes.
- [ ] Published records have stable public snapshots where required.
- [ ] Malformed legacy snapshot document identifiers are zero.
- [ ] Public documents expose only records marked Public and Approved.
- [ ] Internal notes, source references, verification notes and workflow actor IDs are not exposed by public APIs.
- [ ] Public publish/expiry windows have been spot-checked.

## 4. Data and migration

- [ ] Source registers are frozen for the migration window.
- [ ] Migration files pass duplicate and data-quality review.
- [ ] Required reference/name fields are complete.
- [ ] Imported totals reconcile with signed/source totals.
- [ ] Rejected rows are documented and retained for correction.
- [ ] Sensitive files are stored privately, not in public web directories.
- [ ] Resident/public tracker exposes only approved public-safe fields.
- [ ] No live confidential resident data was used in staging before authorization.

## 5. Verification and user acceptance

- [ ] `npm run qa` passes in the target environment.
- [ ] `npm run smoke` passes against staging.
- [ ] Authenticated smoke testing passes with a dedicated test account.
- [ ] `python tools/release_qa.py` passes.
- [ ] Release Control automated server readiness passes.
- [ ] Release Control publishing integrity passes.
- [ ] Public enquiry → reference → staff case → resident tracker flow is tested end to end.
- [ ] CMS → review → verify → publish → public display flow is tested end to end.
- [ ] Mobile and desktop UAT are signed off.
- [ ] Pilot testing is signed off by the responsible office/IT lead.

## 6. Backup, recovery and incident control

- [ ] Encrypted backup schedule and retention are documented.
- [ ] Backup ownership and monitoring responsibility are assigned.
- [ ] A pre-launch backup is created.
- [ ] A backup is restored successfully into a disposable verification environment.
- [ ] Rollback package and database restore instructions are available.
- [ ] Named incident contacts and escalation path are documented.
- [ ] Staff know when to stop data entry if system integrity is uncertain.
- [ ] Audit logging is enabled and review responsibility is assigned.

## 7. Authorization and cutover

- [ ] Named launch lead is present.
- [ ] THA IT / management has reviewed the release evidence.
- [ ] Formal production authorization is recorded.
- [ ] Monitoring is active before public traffic is switched.
- [ ] Migration totals are recorded during cutover.
- [ ] Post-launch smoke test is completed immediately after deployment.
- [ ] Post-launch public and staff workflows are spot-checked.
- [ ] Rollback remains available until the launch is formally accepted.

## Release rule

Do **not** treat a green health endpoint, completed browser checklist or successful Render deployment as production authorization. Final production use requires the technical evidence above plus the responsible THA IT / management decision.
