# Scarborough / Mt. Grace District Office Service System — V266

**Current status: consolidation / staging candidate**

V266 strengthens the **evidence layer** of the office workflow.

The consolidation path remains:

**Today → record/workspace → action → follow-up → evidence → close/report**

V266 focuses on **evidence**.

## One document, multiple legitimate contexts

Historically, a document had one primary relationship:

- `documents.linked_type`
- `documents.linked_id`

That remains for backward compatibility.

V266 adds:

- `document_links`

so one stored document can support multiple work records without duplicate uploads.

Example:

A site photograph can remain one private file while being linked to:
- the Resident Case
- the Field Visit that produced it
- a related Meeting if it was formally considered there

The file itself is stored once.

## Migration 010

New migration:

- `010_document_evidence_links.sql`

It creates:
- `document_links`
- uniqueness protection
- target/document indexes
- backfill of existing primary links
- explicit revocation of direct `anon` / `authenticated` table access

Migration 010 has been applied to the connected Supabase project and recorded in the application's `public.schema_migrations` ledger.

At migration time there were no pre-existing linked documents to backfill, so no historical document relationships were altered.

## Security model

The evidence-link registry follows the existing server-mediated Records model.

Direct Supabase role checks confirm:
- `anon` cannot SELECT or INSERT evidence links
- `authenticated` cannot SELECT or INSERT evidence links

`/api/health/readiness` now requires:
- `document_links` to exist
- direct API isolation to continue covering `document_links`

A future grant mistake will therefore turn readiness red.

## Records API

`GET /api/records` now returns a `links` collection for every record.

New endpoints:

- `POST /api/records/:id/links`
- `DELETE /api/records/:id/links/:linkId`

Secondary links can be added or removed without deleting the underlying document.

Primary links are maintained through the document metadata record so there remains one clear primary context.

New document registrations and secure uploads automatically synchronize their primary link into `document_links`.

## Records Centre

`/staff/records.html` has been rebuilt around the evidence model.

The page now provides:

- Records register
- Document metadata
- Secure upload
- Evidence links

It also shows:
- total registered records
- records with private files
- records needing review
- total evidence-link count

The previous duplicated legacy page header/navigation has been removed.

## Case Workspace evidence roll-up

A case no longer shows only documents directly attached to the Case.

The Case Workspace can now show evidence explicitly linked to:

- the Case itself
- Applications attached to the case
- Correspondence attached to the case
- Field Visits attached to the case
- Appointments attached to the case
- Resident Feedback attached to the case
- Events explicitly linked to the case
- Meetings explicitly linked to the case

This is a **roll-up of explicit relationships**, not inferred matching.

Documents remain authoritative in Records Centre.

## Evidence context

Case Workspace document cards now show the evidence contexts that caused the document to appear.

This helps staff understand whether a document supports:
- the Case
- a Field Visit
- an Application
- a Meeting
- or another explicitly linked work record

## Readiness visibility

System Administration, Production Control and Release Control now display:

- **Evidence link schema**

alongside Resident Profiles, Central Meetings and Direct API isolation.

## Verification

Source validation covers:
- Records API
- Upload API
- Cases / Case Workspace API
- Records Centre
- Case Workspace helper

Preflight requires migration 010.

Authenticated smoke testing verifies:
- Records API returns a `links` array for every record
- Case Workspace returns `evidence_links` arrays for rolled-up documents

## Backend release identity

The server package version is now `266.0.0`.

## Production boundary

V266 improves evidence traceability. It does not weaken record sensitivity, duplicate private files, infer relationships, or authorize production use.
