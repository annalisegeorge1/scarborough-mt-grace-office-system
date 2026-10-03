# Scarborough / Mt. Grace District Office Service System — V265

**Current status: consolidation / staging candidate**

V265 continues the consolidation phase by strengthening the **Case Workspace as the office file** rather than creating another standalone module.

## Related Work in the Case Workspace

The central case workspace already brings together:
- applications
- correspondence
- field visits
- records/documents
- resident feedback and recovery
- appointments
- permanent case notes
- central case activity

V265 adds:

- **linked Events**
- **linked Meetings**

under a new Case Workspace tab:

**Related Work**

## Relationship rule

V265 does not guess relationships.

Events and Meetings appear in a case only when they are explicitly linked using the existing fields:

- `linked_type = Case`
- `linked_reference = <case UUID or case reference>`

This preserves the authoritative source record and avoids duplicating community/event/meeting data inside Cases.

## Direct navigation

Related Work cards open the exact source record.

Examples:

- `events.html?event=<event-id>&tab=manage`
- `meetings.html?meeting=<meeting-id>&tab=manage`

The Events workspace now accepts direct event IDs just as Meetings already accepts direct meeting IDs.

Staff no longer need to:
1. open the module,
2. search for the linked record,
3. reopen it manually.

## Permissions

The Related Work tab respects the existing `community.write` permission.

If a role does not have Community Operations access, the case workspace shows the restricted state rather than exposing Event/Meeting data.

## Verification

Source validation confirms:
- Cases route parses
- Case Workspace helper parses
- Events deep-link logic parses
- Meetings deep-link logic parses

Authenticated smoke testing now inspects the integrated Case Workspace response and requires:
- `applications` array
- `documents` array
- `events` array
- `meetings` array

when an accessible case exists.

## Backend release identity

The server package version is now `265.0.0`.

## Consolidation direction

The office flow remains:

**Today → record/workspace → action → follow-up → evidence → close/report**

V265 improves the **record/workspace** step.

The next consolidation focus should be the **evidence layer**: making documents, correspondence, field evidence and related records consistently attach to and prove the work they support.

## Production boundary

V265 links already-authorized records. It does not broaden access, create inferred relationships, publish private data, or constitute final production authorization.
