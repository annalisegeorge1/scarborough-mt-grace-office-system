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
