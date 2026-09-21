# V161 Backend Integration

V161 moves the highest-value staff workflows from browser-only storage to authenticated server APIs backed by PostgreSQL.

## Directly server-backed in V161
- Cases and public enquiry/tracker
- Applications, checklists and application timeline
- Document metadata and private-file upload/download
- Resident feedback and service recovery
- Field visits
- Events, attendance and event actions
- Community matters, initiatives and partners
- Correspondence
- Staff roster, operational absences and temporary coverage
- Public website content/CMS
- Cross-module search
- Quality-control tables and APIs
- Management summary metrics

## Protected staff access
All staff HTML routes now require an authenticated server session. A dedicated `/staff/login.html` is the public entry point for staff authentication. Static staff pages are no longer openly served to unauthenticated visitors.

## Remaining compatibility work
Training, UAT, readiness, pilot and selected configuration screens remain support/control tools. V161 adds an audited, revision-controlled server workspace API for these non-resident-data modules. They should not be used as a substitute for normalized resident/case data tables.

## Important deployment dependency
The application still requires a real PostgreSQL database, HTTPS, secrets, an initial administrator account and private object storage before confidential live data is used.
