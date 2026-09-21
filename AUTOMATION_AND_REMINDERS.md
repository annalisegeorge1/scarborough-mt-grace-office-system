# Automation, Reminders & Workflow Rules

The Automation Centre is a controlled assistance layer. It may identify due work, generate staff attention items, and support escalation. It must not silently change official case statuses, publish content, close matters, or contact residents without approved rules and permissions.

## Production controls
- Run schedules server-side in the office timezone.
- Use idempotency keys so reminders are not duplicated.
- Record every automated event in the audit log.
- Apply role and data-access permissions before creating or delivering an action.
- Respect resident communication consent and approved channels.
- Provide retry, failure, and manual override controls.
- Keep rules versioned and management-approved.

## Initial rule families
Case follow-ups; case target dates; agency referrals; appointments/site visits; document reviews; CMS publication/expiry; service-recovery actions; unassigned active cases.

## V161 scheduled worker
The production backend includes `npm run reminders`, which scans authoritative PostgreSQL records and creates de-duplicated open attention reminders. Run it from a scheduler (for example, every hour or each morning depending on office policy). It creates reminders only; it does not close records or send resident communications.
