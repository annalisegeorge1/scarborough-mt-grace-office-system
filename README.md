# Scarborough / Mt. Grace District Office Service System — V263

**Current status: controlled pre-launch / staging candidate**

V263 replaces the old browser-only Meetings training page with a responsive, central, audited Meetings workspace.

## Why this release was necessary

Live tablet screenshots exposed two problems:

1. portrait mode was rendering the old Meetings page like a squeezed desktop canvas, leaving a large unused area and making the form difficult to use;
2. Meetings was still stored only in browser localStorage, unlike the newer server-backed Community and Events modules.

V263 fixes both together.

## Central Meetings data model

New migration:

- `009_meeting_operations.sql`

It adds:

- `meetings`
- `meeting_attendance`
- `meeting_actions`
- `meeting_timeline`

Meeting references use the format:

- `SMG-MTG-YYYY-00001`

The migration has been applied to the connected Supabase project and recorded in the application's `public.schema_migrations` ledger.

## Meetings API

New authenticated Community Operations endpoints include:

- `GET /api/ops/meetings`
- `POST /api/ops/meetings`
- `GET /api/ops/meetings/:id`
- `PATCH /api/ops/meetings/:id`
- attendance add/remove
- action add/update/remove
- timeline updates

The API uses the existing `community.write` permission.

Changes are recorded through the server audit log.

Meeting records themselves are not given a casual hard-delete control; staff close or cancel records instead.

## Meetings workspace

`/staff/meetings.html` is now organized into:

- Meeting register
- Meeting editor
- Attendance & actions
- Timeline

The register is the default view.

The page preserves the richer meeting fields:
- meeting type
- status
- title
- area/community
- date and start time
- venue
- lead/chair
- minute taker
- linked record type/reference
- purpose/objective
- agenda
- internal minutes
- decisions/commitments
- resident-safe public outcome summary
- next follow-up

## Privacy split

Attendance names and internal minutes remain staff-only records.

The public/resident-safe outcome summary remains a separate field and is not automatically published. Public release still belongs to the Website CMS / publishing workflow.

## Responsive behavior

The old fixed desktop grid and legacy navigation have been removed.

On tablet/mobile:
- the page uses the full available viewport
- metrics collapse from 6 to 3 to 2 columns
- register cards replace the oversized desktop table
- editor fields collapse from four columns to two and then one
- attendance/actions become stacked panels
- the tab bar scrolls horizontally rather than shrinking the content canvas

## Quick Create

The shared **+ New** menu now includes:

- New meeting

which opens the Meeting editor directly.

## Readiness

`/api/health/readiness` now includes:

- `meetingOperations`

It passes only when all four central meeting tables are present.

System Administration, Production Control and Release Control display **Central Meetings schema** explicitly.

## Verification

Preflight now checks:
- Meetings workspace
- migration 009

Smoke testing now checks:
- unauthenticated Meetings redirect
- authenticated Meetings page
- authenticated Meetings API when the smoke role has Community write access

## Backend release identity

The server package version is now `263.0.0`.

## Production boundary

V263 moves Meetings into durable central storage and improves tablet usability. It does not publish internal minutes or attendance, broaden role access, or constitute production authorization.
