# Scarborough / Mt. Grace District Office Service System — V253

**Current status: controlled pre-launch / staging candidate**

V253 completes the next information-architecture step by introducing a true **Staff Home / Today** landing experience. Staff no longer need to enter the system through Case Management or a management-reporting screen.

## Default staff journey

The intended staff journey is now:

**Sign in → Staff Home → Primary Area → Subpage → Record / Workspace**

Normal sign-in now lands on:

- `/staff/home.html`

Direct protected links still preserve the `next=/staff/...` return behavior.

## Staff Home

The new Home page is deliberately quiet and operational. It shows:

- case follow-ups due today
- overdue case follow-ups
- open cases
- upcoming appointments
- open applications
- open field work
- open resident feedback
- urgent / high-priority cases
- prioritized cases needing action
- upcoming appointments
- quick routes into authoritative modules
- recent server-backed case activity

It does not duplicate production controls, migration controls, website publishing or the full system directory.

## Role-aware Today API

New endpoint:

- `GET /api/today`

The endpoint requires authenticated case access and respects existing RBAC.

For Field Officers, case, application, field and appointment data is limited to assigned/owned work where the underlying workflow already requires that restriction.

For broader staff roles, the Home page can show office-wide operational attention.

The endpoint returns permission flags so the UI does not present inaccessible operational sections as if they were available.

## Home-area navigation

The shared sidebar Home section is now:

- Home
- Daily Workboard
- Operations Centre
- Management Briefing
- Handover
- Attention & Reminders

This makes Home the landing page while keeping the deeper operational tools available as subpages.

## Daily Workboard

The Daily Workboard now reads `/api/today` instead of the management-only `/api/reports/summary`.

This removes the unnecessary Reports-permission dependency for operational roles.

Its metrics are now:
- open cases
- overdue case follow-ups
- open applications where permitted
- open field work where permitted
- upcoming appointments where permitted

## Earlier organization retained

V250–V252 remain in place:
- six-area shared staff shell
- collapsible desktop sidebar and mobile drawer
- contextual subpage tabs
- integrated resident/case workspace
- case-linked Applications, Correspondence, Field, Records and Feedback
- focused Case Management screen
- cleaner touch/tablet navigation

## Backend release identity

The server package version is now `253.0.0`.

## Verification

Preflight now checks:
- Staff Home exists
- Today API route exists
- all previously required navigation/case/release assets

Authenticated smoke testing now verifies:
- Staff Home loads
- Today API responds
- Case Management remains accessible
- existing integrated case/release controls remain covered

Run from `server/`:

- `npm run check`
- `npm test`
- `npm run preflight`
- `npm run qa`
- `npm run smoke`

## Production boundary

V253 changes navigation, staff landing behavior and operational aggregation. It does not change the production authorization boundary, weaken RBAC, alter resident/public privacy rules, or authorize confidential production data.
