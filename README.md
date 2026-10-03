# Scarborough / Mt. Grace District Office Service System — V269

**Current status: feature freeze / structured UAT staging baseline**

V269 deliberately pauses major feature expansion.

The system has reached the point where the priority is proving that the existing office workflow is integrated, usable, secure enough for approved staging use, recoverable, and understandable to staff.

The operating path under test is:

**Today → record/workspace → action → follow-up → evidence → close/report**

## Feature freeze

Freeze rules are documented in:

- `FEATURE_FREEZE_V269.md`

During the freeze, changes should address:
- failed/blocked UAT scenarios
- data-integrity and relationship defects
- authorization/privacy/security defects
- deployment/migration/backup/recovery defects
- accessibility/responsive defects that materially hinder work
- misleading/inconsistent operational wording
- broken links, calculations, navigation or reporting
- removal of duplicate/legacy behavior

New major modules and speculative feature expansion are deferred.

## Structured UAT plan

The placeholder UAT document has been replaced with:

- `UAT_TEST_PLAN.md`

It defines 15 end-to-end acceptance scenarios covering:

- authentication and role boundaries
- resident intake/profile
- case operations
- application/correspondence/field integration
- reusable evidence
- community/event/meeting integration
- unified Today
- resident-safe communication
- formal closure
- central management reporting
- publishing
- roster/coverage
- search/audit/traceability
- responsive/accessibility use
- reliability/backup/recovery

## UAT Centre

`/staff/uat.html` has been rebuilt.

It now provides:
- scenario cards rather than a wide legacy table
- Critical/High severity indicators
- Pass / Fail / Blocked / Not tested results
- tester notes
- evidence-reference fields
- defect register
- manual sign-off gates
- staging environment/readiness snapshot
- exported UAT JSON evidence package
- issue CSV export
- direct routes to Release Control and Records Centre

The old duplicate V159/global navigation has been removed.

## UAT state and evidence

The UAT worksheet intentionally stores temporary test-session state in the browser.

This is acceptable because it is **test evidence**, not operational resident data.

It is not the authoritative sign-off record.

After a formal UAT session, staff must export the UAT package and retain the approved evidence in Records Centre or another approved testing-evidence location.

## No silent fallback

The UAT Centre checks:
- application version
- server readiness
- database readiness
- private storage readiness
- Resident Profiles schema
- Meetings schema
- reusable evidence-link schema
- Direct API isolation

A failed environment check is shown as attention rather than substituted with browser operational data.

## Reporting baseline retained from V268

The freeze baseline includes central:
- Management Reports
- Management Briefing
- formal closure reason reporting
- six-month opened vs closed flow
- current workload distribution

## Verification

Preflight now requires:
- UAT Centre
- feature-freeze document
- current UAT test plan

Smoke testing verifies:
- unauthenticated UAT redirect
- authenticated UAT page availability

## Backend release identity

The staging freeze baseline is:

- `269.0.0`

## Exit from freeze

Feature freeze should end only after structured UAT is complete, Critical/High defects are resolved or formally mitigated, backup/restore is verified, production hosting/security/storage are verified, staff roles/training are confirmed, release evidence is reviewed, and the required THA IT / management authorization is given.

A green automated deployment alone is not production approval.
