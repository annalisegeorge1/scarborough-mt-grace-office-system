# Backend Integration Status — V161

## Production-backed operational workflows
The following workflows now use authenticated server APIs and PostgreSQL directly in their primary staff pages:

- Case management and public enquiry intake/tracking
- Applications and referrals
- Application checklists and timelines
- Document and records metadata
- Private document upload/download when object storage is enabled
- Resident feedback and service recovery
- Field visits and outreach
- Events, attendance and event action items
- Community matters, initiatives and partners
- Correspondence drafting/workflow
- Staff roster, operational absences and temporary coverage
- Website/CMS content
- Global search
- Server-side automation attention scan and reminders
- Quality standards, QA reviews and corrective actions
- Live management summary reporting
- Staff account creation and access listing

## Support/control modules
Training, UAT, readiness, pilot, IT review and procedure/checklist screens are support/control tools rather than resident systems of record. V161 includes an audited revision-controlled workspace API for these modules. They may retain browser presentation state in places, but confidential resident data must not be stored there.

## Security boundaries
- Staff pages are server-session protected. `/staff/login.html` is the unauthenticated staff entry point.
- API authorization remains server-side and role based.
- Public enquiry success requires a database-created reference.
- Private files require configured object storage.
- Public tracking exposes only the restricted resident-safe projection.
- Staff UI visibility is not treated as authorization.

## Remaining deployment dependencies
V161 is not automatically live simply because the code exists. A real deployment still requires PostgreSQL, HTTPS, production secrets, an initial Manager account, private object storage if uploads are enabled, tested backups, and a staging/UAT run before confidential data is entered.
