# V160 Production API Contract

All authenticated state-changing requests use the `smg_session` HttpOnly cookie and must include the current `X-SMG-CSRF` token returned by `/api/auth/login` or `/api/auth/me`.

## Public
- `POST /api/public/enquiries` — creates a central case and returns the official reference.
- `POST /api/public/track` — requires reference + matching phone/email; returns only approved public case fields.
- `POST /api/public/feedback` — requires reference + matching contact before service feedback is accepted.
- `GET /api/health` — application/database health.
- `GET /api/health/readiness` — infrastructure readiness gates.

## Authentication
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout` — requires CSRF.

## Staff operations
- `GET|POST|PUT /api/cases[/:id]`
- `GET|POST|PATCH /api/applications[/:id]`
- `GET|POST /api/records`
- `POST /api/uploads` — authenticated private file upload; production blocked until approved private storage is configured.
- `GET|PATCH /api/feedback[/:id]`
- `GET|POST /api/content`
- `GET /api/audit`
- `GET /api/search?q=...`
- `GET|POST /api/users` — Manager only.

Authorization is always server-side. Hiding a button in HTML is never treated as access control.


## V242 Publishing Desk

The staff Publishing Desk uses the existing `public_content` records. It does not create a second public-content store.

### GET `/api/content/:id/preview`
Permission: `content.write`

Returns the authenticated staff preview model:
- `content`: explicit resident-facing/public-safe fields only
- `workflow`: current workflow, verification state, version and workflow timestamps
- `internal`: staff-only publishing notes/source/verification note
- `readiness`: blocker/warning checklist for publication
- `residentRoute`: public route where the record belongs

The public website continues to use `GET /api/public/content`, which does **not** select the staff-only V242 fields.

### GET `/api/content/:id/revisions`
Permission: `content.write`

Returns up to 100 most recent content revisions with:
- version
- workflow/action
- verified state
- resident-facing snapshot
- internal publishing snapshot
- actor display name/email
- timestamp

### POST `/api/content/:id/workflow`
Permission: `content.publish`

JSON:
```json
{
  "action": "submit-review | return-draft | approve | revise | verify | unverify | publish | archive | restore",
  "sourceReference": "optional source/reference used during verification",
  "note": "optional verification note"
}
```

Controlled workflow:
- Draft → In Review
- In Review → Draft or Approved
- Approved → Draft or Published
- Published → In Review (Start a revision) or Archived
- Archived → Draft

Verification is a separate gate. Publication requires:
- workflow state Approved
- verified=true
- all publication blockers passing

Restore intentionally clears verification so restored content is checked again before republication.

### Stable published snapshot during revisions

When controlled staff workflow moves a Published item into **Start a revision**:

- the editable record moves to `In Review`
- verification is cleared for the new revision
- the last Published + Verified resident-facing payload remains active in `published_snapshot`
- `/api/public/content`, RSS, and public document exposure continue to use that last published snapshot
- internal notes, source references, verification notes, and revision history remain staff-only

Publishing the approved replacement advances the snapshot atomically to the newly verified public payload.

Archiving deliberately deactivates the published snapshot. Restoring an archived record returns it to Draft with the snapshot inactive, so staff must review, verify, and publish again before it becomes public.

The legacy Website CMS remains backward-compatible in V242. The Publishing Desk is the preferred controlled editorial workflow; existing CMS save/override behavior is preserved so staff-side functions are not broken during the transition.

### Revision boundary

V242 adds `public_content_revisions`. Each V242 create/update/workflow change records a versioned snapshot. Staff-only fields are stored in `internal_payload`; resident fields are stored separately in `public_payload`.

### Privacy boundary

The following columns are staff-only and are not selected by `/api/public/content`:
- `internal_notes`
- `source_reference`
- `verification_note`
- review/verify/publish/archive actor IDs and timestamps
- revision history


## V243 Publishing QA

V243 adds an authenticated, server-backed validation surface for the V242 publishing bridge.

### GET `/api/content/publishing-readiness`
Permission: `content.write`

Returns:
- whether migration `006_content_publishing_workflow.sql` is recorded
- whether all required V242 publishing columns exist
- whether `public_content_revisions` exists
- workflow counts
- count of active prior-version snapshots during revisions
- integrity checks for:
  - Published records without verification
  - Archived records with an active public snapshot
  - active snapshots missing payloads
  - Published + Verified records missing a stable snapshot
  - content-version / revision-history mismatches
  - exposed documents that are not both Public and Approved
- a `ready` boolean that is true only when all blocker checks pass

This endpoint is authenticated staff-only. It does not expose resident information through the public API.

### Staff Publishing QA page

Protected page:
- `/staff/publishing-qa.html`

The page combines:
- `/api/content/publishing-readiness`
- `/api/health/readiness`
- the authenticated content register
- per-record preview/revision history

It shows actual server/database evidence rather than a browser-only checklist.

For a selected content record, it derives workflow evidence for:
- Draft captured
- review entered
- source verified
- Approved reached
- Published reached
- revision started
- replacement republished
- archived
- restored to Draft

It also links directly to the Publishing Desk and the record's resident-facing route.

### Progress-history revision integrity

V243 changes Activity Hub progress add/remove operations so they:
- run transactionally
- increment `public_content.version`
- write `public_content_revisions` entries
- preserve audit events
- refresh the stable published snapshot when the parent record is currently Published + Verified

Revision actions are recorded as:
- `progress-add`
- `progress-remove`

This closes a V242 audit gap where public progress metadata could change without a matching content revision version.

### Deployment smoke/preflight coverage

`server/scripts/smoke-test.js` now checks:
- public content API
- unauthenticated Publishing Desk redirect
- unauthenticated Publishing QA redirect
- authenticated Publishing Desk
- authenticated Publishing QA
- authenticated publishing-readiness API

Authenticated checks require the smoke-test account to have the relevant content permission.

`server/scripts/preflight.js` now checks that:
- Publishing Desk exists
- Publishing QA exists
- migration 006 exists in the deployment package

### Certification boundary

Publishing QA verifies application/database state. It does not independently prove:
- DNS correctness
- Cloudflare account state
- Render account/billing state
- successful backup restoration
- human management authorization

Those remain part of the separate Production Readiness and Go-Live controls.


## V244 Publishing Resilience

V244 hardens the V243 Publishing QA and the V242 stable-snapshot public path against incomplete deployments and malformed legacy snapshot metadata.

### Migration-registry resilience

`GET /api/content/publishing-readiness` now checks whether `schema_migrations` itself exists before querying migration 006.

If the migration registry is absent:
- the endpoint returns `ready=false`
- the schema section reports `migrationTablePresent=false`
- migration-dependent integrity checks remain blocked
- the diagnostic endpoint does not fail merely because the migration registry is missing

### Malformed snapshot document identifiers

Publishing QA now counts active public snapshots whose `documentId` value is non-empty but is not a UUID.

The blocker appears as:
- `snapshot-document-id`

The response exposes:
- `integrity.malformedSnapshotDocumentIds`

The staff Publishing QA page surfaces the same value under **Snapshot document IDs**.

### Public document lookup hardening

The public content and public-document routes no longer blindly cast snapshot `documentId` strings to PostgreSQL UUID values.

Snapshot document joins now:
- validate UUID shape before casting
- ignore malformed legacy values safely

`GET /api/public/documents/:id` also validates the route parameter before issuing a UUID-backed database query. Invalid identifiers return the same public-safe 404 response instead of reaching PostgreSQL as malformed UUID input.

### Effective public payload behavior

When a legacy public snapshot contains a malformed `documentId`:
- the malformed identifier is removed from the effective public payload
- the public API does not construct a document-download URL from it
- any independent valid public URL already stored on the snapshot can remain available
- Publishing QA reports the integrity defect for staff correction

### Preservation

V244 does not change:
- staff publishing workflow transitions
- verification rules
- archive/restore behavior
- existing CMS editing
- resident enquiries or tracking
- Activity Hub progress workflows
- public-content privacy boundaries

The change is defensive and diagnostic.
