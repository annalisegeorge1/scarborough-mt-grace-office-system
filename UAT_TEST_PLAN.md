# Scarborough / Mt. Grace District Office — V269 User Acceptance Test Plan

## Purpose

V269 begins the feature-freeze / user-acceptance phase.

Use fictional or specifically approved test data only. UAT should verify that ordinary office work can be completed end-to-end without relying on browser-local operational data, duplicate entry, hidden workarounds, or staff knowledge of the underlying database.

The acceptance path is:

**Today → record/workspace → action → follow-up → evidence → close/report**

## Test evidence

The Staff UAT Centre is a temporary test worksheet. Its browser state is not the authoritative office record.

At the end of each formal UAT session:
1. export the UAT evidence package;
2. export the issue register;
3. retain the approved package in the Records Centre or another approved testing-evidence location;
4. record tester, date, environment/version, and any accepted-risk decision.

## Core scenarios

### UAT-01 — Authentication and role boundaries
Sign in with separate Manager/Administrative, Senior Officer, Field Officer and read-only/reporting test accounts.

Expected:
- each role sees only permitted work areas;
- unauthorized API actions are rejected by the server;
- sign-out invalidates the active session;
- access changes and session revocation behave as expected.

### UAT-02 — Resident intake and profile
Create/select a fictional Resident Profile and start a new case.

Expected:
- resident identity is stored centrally once;
- the case links to the Resident Profile;
- opening the Resident Profile shows the linked case;
- no orphan resident is created if transactional case creation fails.

### UAT-03 — Case operations
Assign a fictional case, set priority, next action, follow-up and target date, then record a permanent note.

Expected:
- Today reflects due/overdue work;
- Case Workspace reflects the update;
- activity/audit history records the change;
- role restrictions are enforced.

### UAT-04 — Applications, correspondence and field work
Create an application/referral, correspondence record and field visit explicitly linked to the test case.

Expected:
- each item remains authoritative in its own module;
- Case Workspace surfaces the linked work;
- direct navigation reaches the correct workspace;
- Today surfaces due work when appropriate.

### UAT-05 — Evidence and Records Centre
Register/upload a fictional document with one primary context and add at least one secondary evidence link.

Expected:
- the file is stored once;
- Records Centre shows all evidence links;
- Case Workspace rolls the document up through explicit related work;
- removing a secondary link does not delete the document;
- sensitivity/review state remains intact.

### UAT-06 — Community, event and meeting integration
Create a fictional Community Matter, Event and Meeting, with Event/Meeting explicitly linked to a Case where appropriate.

Expected:
- Community and Events are centrally stored;
- Meetings attendance/actions/timeline are centrally stored;
- Case Workspace Related Work shows explicit links only;
- event/meeting deep links open the selected record.

### UAT-07 — Unified Today and Daily Workboard
Create overdue, due-today and explicit-attention test work across several permitted modules.

Expected:
- Today orders overdue before due today;
- source module is clear;
- links route to the authoritative workspace;
- Daily Workboard counts agree with Today;
- role-specific scope remains enforced.

### UAT-08 — Resident-safe communication
Use a resident-visible fictional case and record public status/update fields.

Expected:
- resident-facing fields remain separate from internal notes/evidence;
- tracker/public surfaces do not expose restricted notes, evidence or other residents;
- formal closure rejects a resident-visible case without the required public completion/closure update.

### UAT-09 — Formal closure
Prepare a test case with a closure reason and review the Closure tab.

Expected:
- Closure tab lists required blockers and unresolved linked-work warnings;
- only Manager/Administrative test roles can formally move a case to Closed;
- Closed sets a formal closure timestamp;
- reopening clears that timestamp and records an activity/audit event;
- Completed remains distinct from formally Closed.

### UAT-10 — Management reporting
Refresh Management Reports and Management Briefing after test work is created/completed/closed.

Expected:
- counts derive from central records;
- closure reasons and month totals reflect the test data;
- six-month flow is present;
- briefing uses no browser-local operational fallback;
- workload figures are presented as descriptive counts, not staff rankings.

### UAT-11 — Publishing workflow
Create or update test public content using CMS/Publishing Desk/Publishing QA.

Expected:
- draft/review states remain private;
- only authorized publish actions reach public content;
- revision/readiness checks remain healthy;
- hide/restore/revision behavior is auditable.

### UAT-12 — Roster, absence and coverage
Record fictional duty, absence and temporary coverage.

Expected:
- same person cannot cover themselves;
- invalid date ranges are rejected;
- tablet layout remains usable;
- continuity records refresh from the central database.

### UAT-13 — Search, audit and records traceability
Search for the fictional records created through the preceding scenarios and review Audit.

Expected:
- central search finds appropriate authorized records;
- audit events show actor/time/action/object for protected changes;
- sensitive content remains permission-controlled.

### UAT-14 — Responsive and accessibility pass
Complete UAT-02, UAT-03, UAT-05 and UAT-07 on portrait tablet, landscape tablet and keyboard-only desktop navigation.

Expected:
- no forced desktop-width canvas;
- no hidden primary action;
- forms remain readable;
- tab/drawer navigation works;
- focus/labels/status messages are understandable.

### UAT-15 — Reliability, backup and recovery
Run production preflight/staging smoke, test approved backup/restore procedure, and simulate a controlled staging outage or failed deployment.

Expected:
- health/readiness identify failures accurately;
- GitHub/Render smoke identifies deployment/version mismatch;
- rollback/recovery procedure is documented and usable;
- no silent success is reported during outage.

## Acceptance rule

A release is not ready for management go-live consideration until critical workflows have been executed successfully in the intended staging environment and all Critical/High defects are either resolved or formally accepted with a documented mitigation.

A green automated smoke run does not replace UAT, privacy review, backup/restore verification, staff training, or THA IT / management authorization.
