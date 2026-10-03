# Scarborough / Mt. Grace District Office Service System — V250

**Current status: controlled pre-launch / staging candidate**

V250 reorganizes the protected Staff System around a shared information architecture instead of exposing every page at the same navigation level.

## V250 navigation model

The staff workspace now has six primary areas:

1. **Home** — Today, Operations Centre, Management Briefing, Handover, Attention & Reminders
2. **Residents** — Case Management, Applications & Referrals, Correspondence, Field Visits, Resident Feedback
3. **Community** — Community Matters, Events & Volunteers, Meetings
4. **Records & Knowledge** — Records Centre, Global Search, Reports, Performance, Service Quality, Procedures
5. **Communications** — Website CMS, Publishing Desk, Publishing QA
6. **Administration** — Roster, Access, Audit, System, Production, Release Control, Training, UAT, Pilot, Go-Live, IT Review

## Shared staff navigation shell

All protected staff HTML pages except the sign-in page now load:

- `/staff/staff-shell.css`
- `/staff/staff-shell.js`

The shell provides:
- a persistent left sidebar for the six primary work areas
- collapsible area submenus
- contextual horizontal subpage tabs
- current-area/current-page highlighting
- desktop collapse/expand side tab
- mobile slide-out drawer and overlay
- remembered collapsed state
- authenticated staff name/role display
- shortcuts to Search and the System Directory
- a single Sign Out control
- automatic suppression of older duplicated navigation rows

The sign-in page intentionally remains outside the shell.

## Interaction hierarchy

The intended staff hierarchy is now:

**Primary area → subpage tab → record/workspace**

Examples:
- Residents → Applications & Referrals → individual application
- Records & Knowledge → Records Centre → individual document
- Communications → Publishing Desk → content item/revision
- Administration → Release Control → technical/admin evidence

This reduces top-level navigation without removing existing capabilities or backend workflows.

## Existing operational improvements retained

V249 and earlier work remain in place:
- live Daily Workboard management summary
- modern Staff System Directory
- live System Administration diagnostics
- controlled public publishing
- Publishing QA
- Production Control
- Release Control
- Go-Live migration staging
- expanded readiness/preflight/smoke checks

## Backend release identity

The server package version is now `250.0.0`.

## Technical release verification

Run from `server/`:

- `npm run check`
- `npm test`
- `npm run preflight`
- `npm run qa`
- `npm run smoke`
- `npm run migrate`

Preflight now checks that the shared navigation shell assets exist. Authenticated smoke testing also verifies that both shell assets can be served.

## Production boundary

V250 changes staff information architecture and navigation. It does not change production authorization requirements, database schema, resident records, authentication credentials, publishing transitions, or public-content exposure rules.

Use synthetic/test data in staging until the required production review and THA IT / management authorization are complete.
