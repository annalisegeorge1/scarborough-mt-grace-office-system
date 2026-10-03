# Scarborough / Mt. Grace District Office Service System — V258

**Current status: controlled pre-launch / staging candidate**

V258 closes the deployment-verification gap by adding GitHub Actions checks that validate source quality and independently verify the Render staging deployment from GitHub's network.

## Automated verification

New workflow:

- `.github/workflows/verify-and-smoke.yml`

It runs on every push to `main` and can also be started manually.

### Source QA

The first job:
- checks out the repository
- installs Node 20
- installs server dependencies
- runs `npm run check`
- runs `npm test`
- runs production-structured `npm run preflight`

A failed source/test/preflight check now produces a visible GitHub Actions failure instead of silently relying on Render.

### Render staging smoke

After Source QA passes, GitHub independently calls:

- `https://scarborough-mt-grace-staging.onrender.com/api/health/live`

The workflow reads the expected application version from `server/package.json` and waits until Render reports that exact version.

This prevents a smoke test from accidentally validating an older deployment.

Once the expected version is live, the workflow runs:

- `npm run smoke`

against the Render staging service.

The public smoke suite covers:
- liveness and health
- public pages/APIs
- tracker/portal/guide
- protected staff-page redirects

If repository secrets `SMOKE_EMAIL` and `SMOKE_PASSWORD` are configured, the existing smoke script also exercises authenticated staff pages and APIs. Without those secrets, authenticated checks are intentionally skipped.

## Direct Render inspection

A Render connection for ChatGPT is available separately. Connecting it allows direct inspection of Render services, deploys, logs, metrics and environment variables from this conversation. The GitHub workflow remains valuable even with that connection because it provides persistent commit-level verification.

## Database status retained from V257

The connected Supabase project remains ACTIVE_HEALTHY.

Confirmed:
- resident migration 007 applied
- hardening migration 008 applied
- existing case linked to Resident Profile
- operational indexes present
- resident reference function search path hardened
- direct anon/authenticated access to sensitive resident/revision tables not granted

## Backend release identity

The server package version is now `258.0.0`.

## Production boundary

A green GitHub workflow and healthy staging deployment are technical evidence, not final production authorization. Confidential resident use still requires the approved operational, backup, privacy and THA IT / management controls.
