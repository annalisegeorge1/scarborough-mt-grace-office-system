# Scarborough / Mt. Grace District Office Service System — V268

**Current status: consolidation / staging candidate**

V268 strengthens the **report** step of the office workflow.

The consolidation path remains:

**Today → record/workspace → action → follow-up → evidence → close/report**

V268 focuses on reporting directly from the central work records rather than reconstructing activity manually or relying on browser-local data.

## Central management reporting API

New endpoint:

- `GET /api/reports/management`

It derives descriptive operational reporting from PostgreSQL.

### Headline measures

The response includes:
- total cases
- open cases
- operationally Completed cases
- formally Closed cases
- cases created this month
- cases formally closed this month
- overdue case follow-ups
- open/overdue applications
- open field work
- field visits completed this month
- open community matters
- open resident feedback
- open service-recovery actions
- records needing review
- open/overdue meeting actions
- open event actions
- upcoming appointments
- average days from case creation to formal closure where valid closure timestamps exist

These are descriptive office counts, not staff ratings or performance scores.

## Formal closure reporting

The management response includes:

- case status distribution
- formal closure-reason distribution
- case category totals/open/closed
- six-month cases-opened vs formally-closed trend
- case-owner workload distribution

Closure reason reporting uses the formal `closure_reason` field introduced earlier in the case workflow.

Cases without a recorded formal reason are explicitly shown as **Not recorded** rather than silently discarded.

## Management Reports

`/staff/reports.html` has been rebuilt as a responsive central reporting workspace.

Tabs:

- Overview
- Formal closures
- Case mix
- Six-month flow
- Workload distribution

The page clearly labels workload distribution as descriptive counts rather than staff ranking.

It includes:
- live central refresh
- print / save PDF support
- tablet/mobile layouts
- no duplicate legacy navigation
- no browser-local report fallback

## Management Briefing

`/staff/briefing.html` has been replaced with a central-only briefing.

It combines:
- `/api/reports/management`
- `/api/today`

to show:
- open and overdue cases
- cross-module due-today work
- formal closure totals
- closures this month
- open meeting actions
- priority attention items
- current operational pressure
- closure reasons
- current-month throughput

The previous localStorage/browser-test fallback has been removed.

If central reporting is unavailable, the briefing shows that it is unavailable instead of substituting potentially stale browser data.

## Verification

Preflight checks:
- Management Reports
- Management Briefing

Authenticated smoke testing verifies:
- both pages
- `/api/reports/management`
- management response includes headline data plus status, closure, category, six-month trend and workload arrays

## Backend release identity

The server package version is now `268.0.0`.

## Consolidation direction

With Today, Case Workspace, evidence, closure and central reporting now connected, the next phase should be a **feature freeze and structured UAT pass** rather than another major feature expansion.

## Production boundary

V268 improves operational reporting. It does not create staff rankings, political/electoral measures, production authorization, or replace management review of consequential figures.
