# Production System Requirements — Scarborough / Mt. Grace District Office

The package contains a browser-only training implementation so the workflow can be reviewed before a production server is approved. The following rules are required before real resident data is used.

## 1. Case reference generation

Format: `SMG-YYYY-NNNNNN` (example: `SMG-2026-000001`).

The **server/database**, never the browser, must generate the number inside an atomic transaction. A unique database constraint must exist on `reference`. The sequence may reset each calendar year only if the year is part of the unique reference. Client-generated browser references remain training/offline examples only.

## 2. Public enquiry endpoints

- `POST /api/public/enquiries` — validate public intake, create case, return `{ reference }`.
- `POST /api/public/track` — require reference + matching contact channel and return only resident-safe fields.
- `POST /api/public/feedback` — record/update feedback after completion/closure.

Resident tracker response must exclude DOB, internal notes, staff assignments, priorities, uploaded-document metadata, political/electoral data and internal referral references unless explicitly approved for resident display.

## 3. Staff case endpoints

- `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`
- `GET /api/cases`
- `PUT /api/cases/:id`

Production requires individual accounts, HTTPS, hashed passwords, HttpOnly secure session cookies, CSRF controls, audit logs, role authorization enforced server-side, backups and an approved retention policy.

## 4. Website Content endpoints

- `GET /api/public/content?state=published` — public-safe published records only.
- `GET /api/content` — staff content register (authorized staff).
- `POST /api/content` — create Draft.
- `PUT /api/content/:id` — edit.
- `POST /api/content/:id/publish` — Manager/Administrative roles only.
- `POST /api/content/:id/unpublish` — Manager/Administrative roles only.
- `DELETE /api/content/:id` — authorized administrative action with audit log.

Suggested fields: `id`, `type`, `title`, `summary`, `status`, `date`, `location`, `publish_state`, `verified_by`, `created_by`, `created_at`, `updated_at`, `published_at`.

## 5. Content roles

- Manager: create/edit/review/publish/unpublish/delete.
- Administrative: create/edit/review/publish/unpublish.
- Senior Officer: create/edit Draft; publish only if explicitly granted.
- Field Officer: create Draft/field update for review.
- Other staff: read or Draft according to approved permissions.

Public content must never be used as a storage location for resident case files or internal political/electoral strategy.

## 6. Production gate

Do not enable real submissions until the backend database, authentication, HTTPS, backups, permissions, privacy notice, retention rules, logging, and recovery procedures are tested and approved.


## Publishing Workflow Requirements

Production content records should add: `workflow_state`, `publish_at`, `expire_at`, `review_note`, `review_submitted_at`, `reviewed_by`, `reviewed_at`, `published_by`, and `published_at`.

Recommended server rules:
- Public API returns only records with `workflow_state=published`, `publish_at <= now` (or null), and `expire_at > now` (or null).
- Field/Senior staff may create or edit Draft/In Review records but cannot approve/publish unless explicitly granted.
- Manager/Administrative roles may approve, publish, unpublish and correct public records.
- Every workflow transition is written to an immutable audit log.
- Scheduled publication and expiry must be enforced server-side, not by the visitor browser.
- Staff dashboard should provide counts for overdue case follow-ups, unassigned cases, review queue, scheduled content, expiring content and failed publication jobs.


## Case Operations Requirements

Production case records should additionally support:
- `dueDate` — target resolution/decision date separate from the next follow-up date.
- `escalation` — Normal, Manager Review, or Critical / Immediate Review.
- referral contact, acknowledgement date, response status, next external follow-up date and response note.
- document metadata including correspondence/document reference and document date. Actual files must use approved protected object storage; metadata-only browser fallback is not production storage.
- server-computed workload/attention queries for active cases, overdue follow-ups, target-date breaches, pending referrals and documents awaiting review.
- manager workload aggregation by staff member with authorization enforced server-side.
- immutable audit events for assignment changes, target dates, escalation changes, referral changes, document additions and closures.

Suggested endpoints include `GET /api/cases/operations-summary`, `GET /api/referrals?status=pending`, and authorized assignment/escalation update actions. The server remains authoritative for permissions and timestamps.


## Notifications and Appointment Requirements
- Store notification channel, contact and consent timestamps server-side.
- Maintain immutable communication-delivery logs including template, destination, provider result, sender and timestamp.
- Integrate approved WhatsApp/email/SMS providers only after office authorization and privacy review.
- Support appointment/site-visit records with timezone-aware start/end times, assigned staff, location, status and reminders.
- Prevent double-booking by validating staff availability server-side.
- Provide calendar APIs and optional Google Calendar synchronization with per-user authorization.
- Residents must never receive internal notes, staff-only referral details, private attachments or other case data outside approved public templates.
- Reminder jobs must be run by the server, not by a browser tab.


## Plans, initiatives and partnerships
Production deployment should persist initiatives, timeline updates, action items, linked case references and partner records in the central database. Server-side role permissions must control create/edit/delete/publication actions. Public endpoints must return only public-safe fields and public timeline entries. Internal notes, budgets, partner contacts, linked resident cases and staff-only actions must never be returned by public endpoints. Action due dates and partner follow-up dates should feed the central Attention Centre.

Recommended entities: initiatives, initiative_updates, initiative_actions, partners, initiative_partners, initiative_cases. Recommended audit events include initiative_created, initiative_updated, public_visibility_changed, update_added, action_completed, partner_linked and case_linked.


## V142 — Community Matter & Executive Dashboard Requirements
Production should persist community matters centrally with role-based permissions. A community matter may link to many case IDs, but public responses must never expose those case IDs or resident identities. The server should provide aggregate counts only where approved.

Recommended matter fields: id, type, title, area, status, priority, owner_user_id, responsible_agency, identified_at, next_follow_up_at, internal_notes, next_action, public_summary, public_next_step, public_visible, public_timeline_enabled, created_at, updated_at.

Recommended relation tables: community_matter_cases(matter_id, case_id), community_matter_initiatives(matter_id, initiative_id), community_matter_updates(matter_id, visibility, title, body, created_by, created_at). All changes should create audit events.

The Executive Dashboard must calculate operational counts from the server/database rather than browser storage and apply the signed-in user's permissions when displaying sensitive counts or drill-down records.


## Document & Records Management
Production deployment of the Records Centre requires server-side document storage and metadata records. The browser training workspace must not be used for confidential resident files.

Required controls:
- authenticated uploads with file-type and size validation;
- encryption in transit and at rest;
- role-based access to Public, Internal and Restricted records;
- immutable audit events for upload, view, edit, publish, download, supersede and archive actions;
- malware scanning and safe file-name handling;
- retention, review and disposal rules approved by office management;
- backups and tested restoration procedures;
- deliberate public-publication approval separate from internal storage;
- links to cases, community matters, initiatives, meetings and partner records by stable server IDs.

Suggested API surface: `GET /api/records`, `POST /api/records`, `PUT /api/records/:id`, `POST /api/records/:id/files`, `POST /api/records/:id/review`, `POST /api/records/:id/publish`, `POST /api/records/:id/archive`.


## Reporting & Analytics Production Requirements

Production reporting must calculate official figures from the shared server/database rather than browser local storage. Report queries must respect the signed-in staff member's permissions and exclude restricted resident information unless that user is authorized to view it.

The production service should provide authenticated reporting endpoints for cases, referrals, appointments, document-control activity, website publishing, community matters and initiatives. Period filters and metric definitions must be consistent across dashboards and exported reports.

Official reports should record the reporting period, generation time, generating user, source dataset/version and any filters used. CSV/PDF exports containing personal information must be access-controlled and auditable. Management notes should only be persisted if an approved report-record workflow is implemented.

For production dashboards, overdue, response-time, completion, referral and follow-up metrics should be calculated server-side from immutable or auditable timestamps. Browser-generated training metrics are not an official audit record.


## Website CMS & Service Directory
Production must store website content centrally and enforce staff permissions server-side. Required capabilities include content version history, approval/publishing audit events, scheduled publication and expiry, secure media/document storage, rollback, link validation, and server-rendered or API-delivered public content. Service-directory entries must distinguish verified requirements from general guidance and must not imply that the District Office determines another agency's eligibility or approval decision. Emergency/important notices require an authorized publishing role.


## V146 production security requirements
- Individual staff identities; shared mailbox must not be used as a shared application login.
- Server-side RBAC on every staff endpoint and object.
- Secure/HttpOnly/SameSite session cookie, CSRF controls, rate limiting and inactivity/absolute session limits.
- PostgreSQL or equivalent managed relational database with encrypted connections and backups.
- Private document storage with authenticated access, malware scanning and audit events.
- Append-only audit log for authentication, case changes, exports, document access, permission changes and publication actions.
- Public tracker implemented as a restricted view, never a direct exposure of staff records.
- Tested backup restoration, incident response and rollback before production authorization.


## V147 migration and cutover requirements
Production data migration must use authenticated server-side import jobs with audit logging, validation, duplicate handling, transaction rollback, import summaries and reconciliation against source registers. Browser-based CSV staging is for validation only and must never be treated as the authoritative import mechanism.


## Pilot operations requirements
Production pilot records should be stored centrally. Incident and change events must be auditable, role-protected and retained in the approved records system. High/Critical incidents must be capable of triggering workflow pause or rollback. Release history must identify deployed version, actor, time, result and rollback reason where applicable.


## Service quality production requirements
Production must calculate service-standard compliance from authoritative server records, preserve QA/corrective-action audit history, restrict quality-governance edits by role, and retain approved review evidence according to office retention policy.


## Resident feedback production requirements
Production implementation should store feedback, complaints, follow-up consent, acknowledgement, service-recovery actions, outcomes and audit events centrally. Public feedback submission must be rate-limited and protected against abuse. Sensitive complaint information must use role-based access and must not be included in public reporting at individual level.


## Automation and scheduler requirements
Production automation must run in a central scheduler/worker, use America/Port_of_Spain for office schedules, enforce RBAC and communication consent, use idempotent jobs, write audit events, expose failure/retry status, and support management-approved rule versions. Browser timers/localStorage are training-only.


## V153 — Search, duplicate control and data quality
- Production global search must use server-side indexes and enforce role/record permissions before returning results.
- Sensitive/restricted records must never be exposed through search snippets to unauthorized users.
- Duplicate detection should use normalized phone/email/reference fields and conservative similarity rules.
- Record merges require explicit authorization, immutable audit history, source-record preservation and a documented reversal procedure.
- Imports must run data-quality validation before commit and report duplicates/missing required fields.

## Correspondence production requirements
Production must provide centrally generated correspondence references, template versioning, role-based approval, authenticated issue/signatory events, immutable audit history, private final-file storage, and a link from issued correspondence to the relevant case/community matter/initiative and Records Centre entry.

## Field operations production requirements
Production field records require authenticated ownership, server-side persistence, audit history, secure evidence storage, mobile-friendly/offline-safe capture, and conflict-safe synchronization.


## Meeting operations
Production should provide authenticated CRUD APIs for meetings, attendance, decisions and action items, central audit history, secure attachment storage, reminder integration for overdue actions, and CMS publication controls for resident-safe meeting outcomes.


## Events / attendance production model
Production storage should include events, attendance entries, volunteer assignments, partner participation and event action items. Attendance and volunteer records require staff-only access controls, audit logging and retention rules. Public event summaries must be stored separately from private participation data.


## V158 staff continuity requirements
Production must persist duty roster assignments, operational absence periods, temporary coverage and handover records server-side. Access must be limited to authorized staff and each create/update/status change must be auditable. The continuity service should support date-range conflict detection, substitute/coverage ownership and reminders for unaccepted high-priority handovers. Detailed medical/HR evidence must remain outside this operational module unless an approved HR system is integrated.

## V160 executable production backend
- Node.js 20 or newer.
- PostgreSQL 15+ recommended; migrations are in `server/migrations/`.
- HTTPS reverse proxy or managed platform TLS.
- Named staff accounts; shared mailbox credentials must not be used as application logins.
- S3-compatible private object storage is supported by the V160 storage adapter. Keep public document upload disabled until storage, permissions, retention and malware/file-safety controls are approved.
- Run `server/scripts/maintenance.js` on a schedule to clear expired server sessions.
- Database backups must be encrypted, retained according to policy and periodically restore-tested.

## V161 production unification requirements
- Node.js 20 or newer.
- PostgreSQL with `pgcrypto` available.
- HTTPS at the public origin.
- A strong `SESSION_SECRET` supplied through environment/secrets management.
- Individual staff accounts; shared application logins are prohibited.
- Private S3-compatible object storage before `UPLOADS_ENABLED=true`.
- Database migrations 001 through 004 applied in order.
- Staging/UAT before confidential production use.
- Backup and restore verification before launch.


## V163 zero-cost staging profile

For the no-cost staging route, the application is prepared for Render Free Web Service plus Supabase Free Postgres using the Supabase **Session pooler on port 5432**, `DATABASE_SSL=require`, and a small PostgreSQL client pool. Confidential uploads remain disabled. This staging profile is for synthetic/test data and is not the final production infrastructure standard.
