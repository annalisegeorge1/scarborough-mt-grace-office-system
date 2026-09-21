# Staff Duty Roster, Leave, Coverage & Handover

## Purpose
This module supports operational continuity for the Scarborough / Mt. Grace District Office. It records who is scheduled, who is unavailable, who is covering duties, and what work must be handed over. It is not a substitute for the formal HR leave-approval process.

## Operating rules
1. Publish or confirm the weekly duty roster before the work week begins.
2. Record only the minimum operational leave information necessary to plan coverage. Do not store diagnoses, medical certificates or unnecessary personal details in the browser training register.
3. Every confirmed absence marked **Coverage required** should have a covering staff member and date range.
4. High or Critical handovers should be accepted by the receiving officer and should identify the next action and relevant case/application/project references.
5. Field work, events, appointments and resident follow-ups should remain assigned while the primary officer is unavailable.
6. Managers should review continuity exceptions at least weekly and before known periods of reduced staffing.

## Production requirements
Production should use authenticated individual accounts, role-based permissions, a shared PostgreSQL database and audit logging. Formal leave approval should integrate with or defer to the applicable THA/HR process. Sensitive HR material should not be stored in this operational module. Server-side validation should prevent overlapping or contradictory assignments where appropriate and should preserve the history of coverage changes.

## Public/private separation
Staff schedules, leave/absence information, handovers and coverage assignments are internal. The public website should display only normal office opening hours or separately approved public service notices.
