# Scarborough / Mt. Grace District Office Service System — V264

**Current status: consolidation / staging candidate**

V264 begins the deliberate consolidation phase: fewer disconnected dashboards, stronger workflow integration, and a clearer daily operating path.

## Consolidation direction

The intended staff flow is now:

**Today → record/workspace → action → follow-up → evidence → close/report**

V264 focuses specifically on the first step: **Today**.

## Unified office attention

`GET /api/today` now builds one normalized attention queue across the modules the signed-in role is allowed to use.

The queue can include:
- resident case follow-ups
- applications/referrals due for follow-up
- field visits/activity due or already scheduled
- community matter follow-ups
- central Meeting action items
- resident feedback where follow-up has been requested

The underlying modules remain authoritative. Today does not duplicate editing logic.

## Attention priority

The queue is ordered:

1. overdue
2. due today
3. undated items explicitly requiring attention
4. future/upcoming items where applicable

Role restrictions still apply. Field Officers remain limited to the operational records already scoped to them by existing RBAC/query rules.

## Staff Home

`/staff/home.html` now shows:
- **Overdue work** across accessible modules
- **Due today** across accessible modules
- Open cases
- Upcoming appointments
- Open applications
- Open field work
- Community follow-ups
- Open meeting actions
- Open feedback
- Urgent/high-priority cases

The main Home panel is now:

**What needs action now**

rather than a Case-only attention list.

Each attention item identifies its source module and routes staff into the authoritative workspace.

## Meeting-action deep links

Today can link directly to:

`meetings.html?meeting=<id>&tab=manage`

The Meetings workspace now accepts those query parameters and opens the selected meeting directly in the requested operational tab.

This removes the previous extra step of opening Meetings and searching again.

## Daily Workboard

The Daily Workboard now uses the same cross-module Today summary.

Its top metrics are:
- overdue attention
- due today
- open cases
- open applications
- open field activity
- open meeting actions

The duplicate legacy auth/header navigation has been removed from the page.

The Workboard remains a routing/overview surface rather than a second editing system.

## Legacy/consolidation audit

At the start of this phase, repository-wide searches no longer found the broad legacy patterns targeted earlier:
- old V159 global navigation
- old duplicate auth-line markup
- old hero-nav/nav2 patterns in the audited search pass
- browser-local meeting storage has already been replaced by V263 central Meetings

The focus can therefore move from wholesale legacy removal toward integration, consistency and operational reliability.

## Verification

Source validation confirms:
- Today API JavaScript parses
- Staff Home inline JavaScript parses
- Daily Workboard inline JavaScript parses
- Meetings deep-link JavaScript parses

Authenticated smoke testing now validates the Today response structure itself and requires:
- an `attention` array
- `summary.attentionOverdue`
- `summary.attentionDueToday`

rather than checking HTTP status alone.

## Backend release identity

The server package version is now `264.0.0`.

## Production boundary

V264 consolidates operational attention. It does not broaden role access, move authority away from the underlying modules, publish confidential records, or constitute final production authorization.
