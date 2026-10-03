# Scarborough / Mt. Grace District Office Service System — V255

**Current status: controlled pre-launch / staging candidate**

V255 adds a first-class Resident Profile layer on top of the V250–V254 staff architecture.

The system can now treat a resident as a person with a continuing office history rather than treating every case as an isolated identity.

## Resident data model

New migration:

- `007_resident_profiles.sql`

It adds:
- `residents`
- resident references such as `SMG-RES-2026-000001`
- `cases.resident_id`
- indexes for resident name, phone, email and case linkage

### Safe migration rule

Existing records are **not automatically merged** based on similar names, phone numbers, addresses or email addresses.

During migration, every existing case without a resident link receives its own resident profile.

This deliberately avoids incorrectly combining two different people.

Staff can then explicitly reassign/link cases to the correct resident profile when they have verified that the records belong to the same person.

## Resident Directory

New staff page:

- `/staff/residents.html`

Staff can search profiles by:
- resident profile reference
- name
- phone
- email
- address

The directory shows case totals, open-case totals and recent case activity.

Field Officers only receive resident profiles associated with cases they are permitted to access.

## Resident Profile

New staff page:

- `/staff/resident.html?id=<resident-id>`

A Resident Profile combines the resident's authorized office history into tabs for:

- Overview
- Cases
- Applications
- Correspondence
- Field Visits
- Documents
- Feedback
- Activity

Permission-restricted sections remain unavailable when the signed-in role does not have access to the underlying module.

## Resident Profile API

New endpoints include:

- `GET /api/residents`
- `GET /api/residents/:id`
- `POST /api/residents`
- `PATCH /api/residents/:id`
- `POST /api/residents/:id/link-case`

The API reuses existing RBAC permissions.

For Field Officers, profile access is limited to residents attached to cases assigned to or owned by that officer.

## Case integration

Cases now carry `residentId` through the shared case shape.

When a new case is created without an existing resident profile, the server creates the resident and case in the same database transaction.

When a verified existing resident profile is supplied, the new case can link to that resident instead.

Existing Case Workspace drawers now include:

**Open Resident Profile →**

## Linking existing cases

Resident Profile allows staff with case-write authority to enter a case reference and explicitly link it to the current resident.

If the case already belongs to another resident profile, the API returns a conflict and requires explicit reassignment confirmation.

No silent resident merges occur.

## Global Search

Global Search now includes authorized Resident Profile results.

Resident search is migration-safe: if the resident table is not present yet, the rest of Global Search continues functioning.

## Navigation

Within the **Residents** area, the shared shell now presents:

- Resident Profiles
- Case Management
- Applications & Referrals
- Correspondence
- Field Visits
- Resident Feedback

The individual `resident.html` page remains inside the Resident Profiles navigation context.

## Live readiness

`/api/health/readiness` now includes:

- `residentProfiles`

This check passes only when both:
- the `residents` table exists
- `cases.resident_id` exists

A deployment therefore cannot report fully ready while the V255 schema migration is missing.

## Backend release identity

The server package version is now `255.0.0`.

## Required deployment step

Before exercising Resident Profiles on a deployed environment, run:

`npm run migrate`

This applies migration 007 after the previously recorded migrations.

## Verification

Preflight now checks:
- Resident Directory
- Resident Profile workspace
- Resident Profile API route
- migration 007

Authenticated smoke testing checks:
- Resident Directory page
- Resident Profile shell
- Resident Profile list API
- first accessible Resident Profile detail when one exists

## Production boundary

V255 creates a structured resident identity layer but does not authorize production use or change the office's privacy obligations.

Resident data remains subject to approved hosting, access, retention, backup, audit and THA IT / management controls.
