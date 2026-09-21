# V163 — Zero-Cost Staging: Render + Supabase

- Added root `render.yaml` Blueprint for a free Render staging web service.
- Added Supabase Session-pooler staging configuration and TLS requirements.
- Render hostname can now supply the secure public origin automatically until a custom staging domain is attached.
- Database pool size is configurable and defaults conservatively in production.
- Health readiness no longer requires private storage when uploads are deliberately disabled.
- Added provider readiness checker and staging deployment documentation.
- Sensitive file uploads remain disabled in zero-cost staging.
- Added first Manager bootstrap and Cloudflare staging-domain procedures.

---

# Release Notes — V162

V162 is the **Production QA & Deployment Candidate** release.

Major changes:
- Added request IDs, staff/API no-cache controls, staff no-index headers and restrictive Permissions Policy.
- Added a dedicated liveness endpoint at `/api/health/live`.
- Added staging and production environment templates and Compose examples.
- Added executable preflight, smoke-test and backup-restore verification tools.
- Added package-level static QA for broken local links, duplicate IDs, server syntax and staff-preview leakage.
- Added a formal production launch checklist and staged release procedure.
- Updated Production Control to reflect the V162 release-candidate workflow.

V161 remains the rollback baseline.
