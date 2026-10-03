# Scarborough / Mt. Grace District Office Service System — V267

**Current status: consolidation / staging candidate**

V267 strengthens the **closure** step of the office workflow.

The consolidation path remains:

**Today → record/workspace → action → follow-up → evidence → close/report**

V267 focuses on **formal case closure**.

## Completed vs Closed

The system now treats these statuses deliberately:

- **Completed** — operational work may be complete.
- **Closed** — the case file has been formally closed.

This preserves the existing workflow distinction instead of treating both labels as interchangeable.

## Formal closure authority

Formal transition to **Closed** is server-enforced for:

- Manager
- Administrative

A case cannot be created directly in the Closed state.

A formally closed case cannot be edited/reopened through the normal case update path by a role without formal closure authority.

This aligns the backend with the long-standing Case Management closure control.

## Formal closure requirements

Before entering Closed, the server requires:

- a closure reason
- for resident-visible cases, public status must be **Completed** or **Closed**
- for resident-visible cases, a resident-facing completion/closure update must be recorded

These are true server-side controls, not only browser checks.

## Closure timestamp

The existing `cases.closed_at` field is now maintained correctly:

- entering Closed sets the timestamp
- reopening clears it
- existing timestamp is preserved while a case remains Closed

The client case shape now exposes:

- `closedAt`

## Closure readiness

The Case Workspace API now returns:

- `closureReadiness`

It contains:
- whether the current role can formally close
- whether the case is already formally closed
- closure timestamp
- required blockers
- unresolved linked-work warnings
- calculated readiness

### Required blockers

The checklist can require:
- closure reason
- resident-facing Completed/Closed status
- resident-facing completion/closure update

### Review warnings

The workspace also surfaces unresolved work such as:
- open applications
- incomplete field visits
- correspondence not yet issued/archived
- open resident feedback
- open service-recovery actions
- future appointments
- open event actions
- open meeting actions
- evidence still needing records review
- referral follow-up still open

Warnings are intentionally advisory rather than universal hard blockers because legitimate transfer/referral closure scenarios may leave external work continuing elsewhere.

## Case Workspace

A new tab has been added:

**Closure**

It displays:
- formal closure authority
- required prerequisites
- unresolved linked-work warnings
- formal closure timestamp when closed
- a route back to Case Management to resolve required fields

This gives staff a clear final review before closing the case file.

## Activity and audit

Formal closure now records:
- a **Case closed** activity event with the closure reason
- audit metadata indicating formal closure

Reopening records:
- a **Case reopened** activity event
- audit metadata indicating reopening

## Policy wording cleanup

The older Case Management operating note previously bundled assignment and closure into one statement.

It now states:
- formal closure requires Manager/Administrative authority
- assignment controls remain role-based

No assignment permission was changed in V267.

## Verification

Source validation confirms:
- Cases API parses
- case-shape helper parses
- Case Workspace helper parses

Authenticated smoke testing now requires `closureReadiness` to contain:
- `blockers` array
- `warnings` array
- boolean `ready`
- boolean `canFormalClose`

## Backend release identity

The server package version is now `267.0.0`.

## Production boundary

V267 adds closure integrity and visibility. It does not automatically decide that unresolved linked work is acceptable, change assignment policy, or constitute final production authorization.
