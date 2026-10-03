# Scarborough / Mt. Grace District Office Service System — V261

**Current status: controlled pre-launch / staging candidate**

V261 completes the first Administration-area visual cohesion pass by bringing **System Administration** and **Production Control** into the same compact visual language introduced for Roster & Coverage, Access Control and Audit Review.

## Shared Administration cohesion asset

New shared stylesheet:

- `/staff/admin-cohesion-v261.css`

It centralizes the presentation used by System Administration and Production Control so future spacing, typography and tablet refinements do not need to be maintained separately.

## System Administration

`/staff/system.html` keeps its existing live logic and endpoints.

V261 changes presentation only:
- removes the redundant in-page auth line
- removes the redundant internal Administration navigation
- relies on the shared staff shell for navigation
- converts the oversized full-width hero into a compact Administration header
- reduces metric-card height
- reduces panel-heading size
- tightens live-check rows
- reduces route-card and toolbar spacing
- improves tablet/mobile proportions

The live system-health, readiness, resident-schema, direct-API-isolation and publishing checks are unchanged.

## Production Control

`/staff/production.html` keeps its release-control logic and production boundary unchanged.

V261:
- removes the redundant in-page auth line
- removes the redundant hero navigation
- keeps the shared staff shell as the single navigation layer
- compacts the Production Control header
- reduces oversized metrics and panels
- tightens technical-readiness rows
- makes the controlled release path more compact
- reduces operational-route card height
- improves tablet/mobile density

The page still contains no go-live switch.

## Administration area after V261

The principal Administration pages now follow the same overall pattern:

- Roster & Coverage — compact tabbed continuity workspace
- Access Control — responsive account-management workspace
- Audit Review — live server audit workspace
- System Administration — compact live-health workspace
- Production Control — compact release-control workspace

## Verification

Source validation confirms:
- System Administration inline JavaScript parses
- Production Control inline JavaScript parses
- neither page contains its old duplicate internal navigation
- neither page contains the duplicate in-page auth line

Preflight now checks the shared Administration cohesion stylesheet.

Authenticated smoke testing checks the stylesheet when staff smoke credentials are configured.

## Backend release identity

The server package version is now `261.0.0`.

## Automated deployment verification

The GitHub verification workflow remains active.

For V261 it will:
- run source checks
- run unit tests
- run production preflight
- wait for Render staging to report version `261.0.0`
- run the staging smoke suite

Transient 429/502/503/504 responses are retried before being treated as persistent failures.

## Production boundary

V261 is a user-interface cohesion release. It does not alter RBAC, resident data, production authorization, privacy requirements or release-governance boundaries.
