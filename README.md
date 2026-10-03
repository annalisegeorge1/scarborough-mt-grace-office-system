# Scarborough / Mt. Grace District Office Service System — V259

**Current status: controlled pre-launch / staging candidate**

V259 rebuilds **Roster & Coverage** for practical tablet use after live screenshots showed that the previous page was too tall, visually repetitive and difficult to scan.

## Roster & Coverage redesign

The page now follows a tighter workflow:

**Continuity summary → Add record → Current continuity records**

Instead of rendering three large forms at once, staff choose one compact tab:

- Duty roster
- Absence
- Temporary coverage

Only the active form is shown.

## Continuity summary

The page now shows:
- total stored roster assignments
- absences active today
- coverage arrangements active today
- active staff not absent today

These numbers are derived from the live roster/absence/coverage data returned by the existing operations API.

## Tablet and mobile behavior

The old wide continuity tables no longer dominate smaller screens.

At tablet widths:
- the form becomes two-column, then one-column on smaller devices
- continuity records render as stacked cards
- oversized controls are reduced
- duplicated legacy page navigation/header is removed
- the shared V250+ staff shell remains the only global navigation layer

Desktop retains a compact combined table beneath the card summaries.

## Coverage safeguards

The UI now prevents:
- selecting the same person as both unavailable and covering staff
- reversed coverage date ranges
- reversed absence date ranges
- choosing a covering officer with an overlapping operational absence already loaded on the page

The database already contains hard constraints preventing:
- coverage end dates before start dates
- absence end dates before start dates
- a staff member covering themselves

The V259 UI therefore improves usability while retaining the existing database safeguards.

## Data-minimization reminder

The page explicitly states that this is an operational continuity tool, not an HR medical record.

Staff are instructed to record only information needed to maintain duty coverage.

## Verification

Preflight now checks that `staff/roster.html` exists.

Smoke testing verifies:
- the page is protected when unauthenticated
- the page loads for authenticated roles with reporting access

## Backend release identity

The server package version is now `259.0.0`.

## Automated deployment verification

The V258 GitHub Actions workflow remains active.

After V259 reaches `main`, GitHub will:
- run syntax checks
- run unit tests
- run production preflight
- wait for Render staging to report version `259.0.0`
- run the staging smoke suite

## Production boundary

Roster & Coverage remains an operational continuity feature and must not be used to store unnecessary medical or confidential HR information.
