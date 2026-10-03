# Scarborough / Mt. Grace District Office Service System — V260

**Current status: controlled pre-launch / staging candidate**

V260 continues the Administration-area cleanup by rebuilding **Access Control** and **Audit Review** as live, tablet-friendly administrative workspaces.

## Access Control

`/staff/access.html` no longer uses the older desktop-first account table and duplicated navigation.

The page now provides:
- account totals
- active/disabled account counts
- MFA-required count
- search and account-state filters
- responsive account cards
- account creation
- account detail/editing
- role changes
- active/disabled status changes
- MFA-required setting
- optional password reset
- active-session review
- session revocation

All changes continue to use the existing server-enforced Access Administration API and are audited by the backend.

No shared-login workflow was added.

## Audit Review

`/staff/audit.html` no longer contains the old browser-only training audit list.

It now reads the real server audit log from:

- `GET /api/audit`

The page presents:
- latest event count
- last-24-hour event count
- access/authentication event count
- case/resident event count
- actor/event/object search
- event-group filtering
- outcome filtering
- responsive audit timeline
- filtered CSV export

The page is read-only: it does not create, modify or delete audit events.

## Tablet/mobile consistency

Access Control and Audit Review now use the same Administration visual language as the V259 Roster & Coverage redesign:
- shared staff shell only
- no duplicate legacy navigation
- compact controls
- card-based tablet/mobile layouts
- reduced vertical waste
- consistent Administration headings, metrics and action patterns

## Staging verification improvement retained

The smoke suite now retries transient HTTP statuses:
- 429
- 502
- 503
- 504

up to three attempts.

This addresses one-off Render/proxy cold-start responses while still failing persistent errors.

The V259 staging run proved:
- Render reached application version 259.0.0
- liveness passed
- health passed
- readiness passed
- public APIs and resident pages passed
- all protected staff redirect checks passed

The only V259 smoke failure was a single transient 502 on the first public-homepage request; the retry-capable smoke helper is now in the repository.

## Verification

Preflight checks:
- Roster & Coverage
- Access Control
- Audit Review
- the previously required staff/release assets

Authenticated smoke checks now test Access Control for access-admin roles and Audit Review plus the audit API for roles with audit access.

## Backend release identity

The server package version is now `260.0.0`.

## Production boundary

A technically healthy staging environment and complete audit/access tools do not replace final production authorization, approved account governance, privacy controls or THA IT / management approval.
