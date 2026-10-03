# Scarborough / Mt. Grace District Office Service System — V262

**Current status: controlled pre-launch / staging candidate**

V262 applies the same tablet-first cleanup used in Administration to the **Community** and **Website / Communications** areas.

## Community Operations

`/staff/community.html` has been rebuilt around a compact workflow:

**Summary → one active editor → central register**

Instead of showing three long forms at once, staff switch between:
- Community matter
- Initiative / project
- Partner

The page now includes:
- compact community metrics
- one form at a time
- stronger required-field checks
- a card-based central register on tablet/mobile
- reduced vertical spacing
- no duplicate legacy header or in-page navigation

Quick Create now safely opens the Community Matter editor rather than triggering the old Save button.

## Events & Volunteers

`/staff/events.html` now separates:
- Events register
- Event editor
- Attendance & actions

The default view is the event register rather than a full-page form.

Opening an event can take staff directly to:
- editing
- attendance
- actions arising

The page now includes:
- event totals
- planned/confirmed count
- completed count
- recorded attendance total
- responsive event cards
- compact form controls
- tablet-friendly attendance/action panels

The existing event APIs and database records remain authoritative.

## Website CMS

The CMS publishing/editor logic is intentionally preserved.

New shared presentation asset:

- `/staff/content-cohesion-v262.css`

The CMS now:
- removes its duplicate in-page auth line/navigation
- uses the shared staff shell as the navigation layer
- has a compact header
- uses smaller editor controls
- keeps the three content tabs
- reduces card and textarea height
- constrains long content tables inside scrollable register panels
- uses sticky table headers
- improves tablet/mobile density

Publishing, upload, hide/restore, activity-thread and workflow logic are unchanged.

## Verification

Source validation confirms:
- Community inline JavaScript parses
- Events inline JavaScript parses
- Website CMS inline JavaScript parses
- staff-shell JavaScript parses
- none of the three screenshot-target pages retain the legacy duplicated page header/navigation

Preflight now checks:
- Community Operations
- Events & Volunteers
- Website CMS
- content-cohesion-v262.css

Authenticated smoke testing covers the same pages when the smoke role has the required permissions.

## Backend release identity

The server package version is now `262.0.0`.

## Automated staging verification

The GitHub deployment workflow will:
- run source QA
- run tests
- run production preflight
- wait for Render staging to report version `262.0.0`
- run the staging smoke suite

## Production boundary

V262 is a workflow/presentation release. It does not broaden public visibility, bypass publishing controls, weaken RBAC, or authorize production use.
