# Scarborough / Mt. Grace District Office Service System — V254

**Current status: controlled pre-launch / staging candidate**

V254 makes the shared staff navigation permission-aware. Staff no longer see every module simply because it exists.

## Permission-aware navigation

The authentication API now returns the signed-in role's effective permission list alongside the user/session payload.

The shared staff shell filters both:
- primary sidebar areas
- contextual subpage tabs

using the same permission names defined by server RBAC.

The backend remains the security boundary. Navigation filtering is a usability layer and does not replace API permission enforcement.

## Examples

### Field Officer
The sidebar is reduced to operational destinations such as:
- Home
- Daily Workboard
- Case Management for assigned work
- Applications for assigned work
- Field Visits
- Community
- Search

Administrative, publishing, reporting, records-management and release-control pages are not presented when the role cannot use them.

### Senior Officer
The shell emphasizes:
- Home
- Cases
- Applications
- Correspondence
- Field
- Feedback
- Community
- Search

Management reporting and system administration remain hidden unless permitted.

### Administrative / Manager
Broader operational, records, communications and administration areas remain visible according to the server permission model.

## Direct-page behavior

If a user manually opens a known staff page that their role cannot use, the shell redirects to Staff Home rather than leaving them on a page whose APIs will only return permission errors.

This does not grant or revoke permissions; the server APIs continue enforcing RBAC.

## Staff root

Authenticated visits to `/staff` now redirect to:

- `/staff/home.html`

rather than Case Management.

## Auth payloads

Both:
- `POST /api/auth/login`
- `GET /api/auth/me`

now include a `permissions` array.

The shared production client retains that permission list for staff UI behavior.

## Backend release identity

The server package version is now `254.0.0`.

## Verification

Authenticated smoke testing now requires permission arrays in the login and `/api/auth/me` responses in addition to the existing protected-page and workflow checks.

## Production boundary

V254 reduces visible complexity. It does not weaken API permissions, broaden role access, alter resident data or authorize production use.
