# Scarborough / Mt. Grace District Office Service System — V251

**Current status: controlled pre-launch / staging candidate**

V251 builds on the V250 navigation architecture by turning Case Management into a central resident workspace rather than forcing staff to treat Applications, Correspondence, Field Visits, Records and Feedback as disconnected systems.

## Staff information architecture

The V250 six-area shell remains:

1. **Home**
2. **Residents**
3. **Community**
4. **Records & Knowledge**
5. **Communications**
6. **Administration**

V251 adds the next level of hierarchy inside Residents:

**Residents → Case Management → Case Workspace Tabs → Linked Record**

## Integrated case workspace

Opening a case now reorganizes the case drawer into tabs:

- **Overview**
- **Activity**
- **Applications**
- **Correspondence**
- **Field Visits**
- **Documents**
- **Feedback**
- **Timeline**

The original case-management controls are preserved and moved into the appropriate tabs rather than rewritten.

### Overview
Resident identity, enquiry, case management, community/project linkage and resident-record summary.

### Activity
Appointments/notifications, resident-facing updates and permanent internal case notes.

### Applications
Applications attached through the database `applications.case_id`, plus the existing referral controls.

### Correspondence
Correspondence linked to the case by type/reference.

### Field Visits
Field records linked to the case reference or ID.

### Documents
Central Records Centre documents linked to the case.

### Feedback
Resident feedback and service-recovery context linked to the case.

### Timeline
Server-backed `case_activity` history.

## Permission-aware aggregation

New endpoint:

- `GET /api/cases/:id/workspace`

The endpoint does not bypass module permissions. It returns each linked section only when the signed-in role already has the corresponding permission.

Field Officers remain restricted to assigned case/application/field/appointment records where applicable.

## Permanent case notes and activity

V251 starts using the existing production tables that were already present in the core schema:

- `case_notes`
- `case_activity`

New endpoint:

- `POST /api/cases/:id/notes`

Internal notes are now stored centrally and create a corresponding case-activity event.

Case creation also creates a central activity entry, and central case updates record important changes such as status, priority, ownership, follow-up, target date, escalation, next action, referral agency and public status.

No new database migration is required for V251 because these tables already existed in migration 001.

## Case-context subpages

When staff leave the case workspace for a dedicated module, V251 carries case context into:

- Applications & Referrals
- Correspondence
- Field Operations
- Records Centre
- Resident Feedback

These pages show a case-context banner, prefill the appropriate linkage fields and scope the displayed register where possible.

Applications created from case context now persist the case ID through `applications.case_id`.

Opening those modules directly without case parameters still shows the normal full register.

## V251 assets

- `/staff/case-workspace-v251.css`
- `/staff/case-workspace-v251.js`
- `/staff/case-context-v251.css`
- `/staff/case-context-v251.js`

## Backend release identity

The server package version is now `251.0.0`.

## Verification

Preflight verifies all V250 staff-shell assets plus all V251 case-workspace/context assets.

Authenticated smoke testing now verifies:
- V251 assets are served
- core case-linked modules are accessible
- Cases API is available
- the integrated workspace endpoint is tested against the first accessible case when one exists

Run from `server/`:

- `npm run check`
- `npm test`
- `npm run preflight`
- `npm run qa`
- `npm run smoke`

## Production boundary

V251 changes staff organization and uses existing server-backed case relationships. It does not change the production authorization boundary. Real resident data should only be used after the required production review, security controls and THA IT / management authorization are complete.
