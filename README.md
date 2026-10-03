# Scarborough / Mt. Grace District Office Service System — V256

**Current status: controlled pre-launch / staging candidate**

V256 adds a controlled **New Case** workflow and a permission-aware **Quick Create** menu across the protected staff system.

## New Case workflow

New staff page:

- `/staff/new-case.html`

A case can begin in either of two ways:

1. **Existing Resident Profile**
   - search the authorized resident directory
   - select the verified resident
   - create the case under that resident identity

2. **New resident for this case**
   - enter the resident's basic identity/contact information
   - create the resident and case together in one database transaction

The second path does not create an orphan Resident Profile if case creation fails.

## Case intake

The controlled intake captures:
- case / enquiry type
- priority
- enquiry / request
- next action
- next follow-up
- target / due date
- escalation state
- assigned officer
- case owner

After a successful save, staff are sent directly into the new Case Management workspace.

## Assignment rules

New endpoint:

- `GET /api/cases/options`

It returns active case-working staff permitted for assignment.

Field Officers creating a case are automatically set as:
- assigned officer
- case owner

For broader case-writing roles:
- assignment can be selected
- the signed-in creator remains the default case owner unless changed

The server validates that selected owner/assignee accounts are active case-working staff.

## Resident Profile integration

Resident Profile now includes:

- **New case**
- **Open latest case**

The New Case action passes the current resident identity directly into the controlled intake workflow.

## Quick Create

The shared staff header now includes a permission-aware:

**+ New**

menu.

Depending on the signed-in role, it can expose:
- New case
- New resident
- New application
- New correspondence
- New field visit
- New community matter
- New event
- New record

Items are filtered using the same RBAC permission names used by the server.

Senior Staff or other roles with no relevant write permission do not receive meaningless creation actions.

## Existing-module creation

For staff modules that already had a safe native **New** action, Quick Create opens that existing creation flow using a small query-state handoff rather than duplicating another form.

Standalone New Resident is intentionally not shown to Field Officers; Field Officers can still create a new resident safely as part of the transactional New Case workflow.

## Navigation context

`new-case.html` is treated as part of the **Residents** area, so the user retains the Residents navigation context while creating a case.

## Backend release identity

The server package version is now `256.0.0`.

## Verification

Preflight checks that the New Case workflow exists.

Authenticated smoke testing verifies:
- the New Case page is protected
- the New Case page can be served after authentication
- the case-creation options API responds when the smoke role has case-write permission

Smoke testing does **not** create a real case.

## Database requirement

V256 depends on the V255 resident-profile schema.

Before using New Case on a deployed environment:

`npm run migrate`

must have applied migration 007.

## Production boundary

V256 improves controlled staff intake and navigation. It does not authorize production use, weaken RBAC, or bypass resident-data privacy and records requirements.
