# Scarborough / Mt. Grace District Office Service System — V252

**Current status: controlled pre-launch / staging candidate**

V252 responds directly to the remaining visual clutter seen on the deployed Case Management screen. The shared V250/V251 navigation is now treated as the only global staff navigation layer, and Case Management is reduced to a focused resident-case workspace instead of carrying legacy launch, training, website and administration dashboards on the same page.

## Case Management hierarchy

The intended Case Management screen is now:

**Residents → Case Management → Case Queues → Metrics → Filters → Case Register → Case Workspace Tabs**

Opening a case continues into the V251 integrated workspace:

- Overview
- Activity
- Applications
- Correspondence
- Field Visits
- Documents
- Feedback
- Timeline

## V252 cleanup

On Case Management, the shared staff shell now visually replaces older duplicated layers including:

- the legacy District Office Staff System module row
- the internal mailbox banner
- the old operations-suite notice
- the old Case Operations hero card
- repeated pre-launch data-guard banners
- Production Security Foundation cards
- Go-Live cards
- Training / UAT / Pilot cards
- the old internal portal topbar
- the old internal module/sidebar navigation
- embedded Operations Control
- embedded Attention Centre
- embedded Website Management
- embedded Notifications & Appointments hub

Those capabilities still exist in their proper staff areas and pages. They are no longer stacked on the Cases page.

## Case queues

V252 adds a compact queue controller above the case register:

- All Cases
- My Cases
- Overdue
- Urgent / High
- Status selector
- Refresh
- Today
- Global Search

The controls proxy the existing queue logic, preserving the underlying case-filter behavior and counts.

## Mobile / tablet organization

The shared contextual subpage tabs now use stronger contrast, borders and active-state emphasis on touch-sized screens so inactive tabs do not appear disabled.

The side-navigation control remains:
- collapsible rail on desktop
- slide-out drawer on mobile/tablet

## V252 assets

- `/staff/case-focus-v252.css`
- `/staff/case-focus-v252.js`

V250 and V251 assets remain in use:
- shared staff shell
- integrated case workspace
- case-context helpers

## Backend release identity

The server package version is now `252.0.0`.

## Verification

Preflight verifies the V252 focused Case Management assets.

Authenticated smoke testing verifies that the focused-case CSS and JavaScript are served.

Run from `server/`:

- `npm run check`
- `npm test`
- `npm run preflight`
- `npm run qa`
- `npm run smoke`

## Production boundary

V252 is an information-architecture and presentation cleanup. It does not remove backend capabilities, change resident data, weaken RBAC, alter publishing rules, or authorize production use.
