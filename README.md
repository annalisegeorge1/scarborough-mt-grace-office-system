# Scarborough / Mt. Grace District Office Service System — V257

**Current status: controlled pre-launch / staging candidate**

V257 hardens the database path used by V253–V256 and makes resident-data isolation visible in release readiness.

## Database hardening

New migration:

- `008_operational_indexes_and_function_hardening.sql`

It has been applied to the connected Supabase project and recorded in both:
- Supabase migration history
- the application's `public.schema_migrations` ledger

This prevents Render's startup migration runner from reapplying it.

## Resident-reference function

`public.next_resident_reference()` now has an explicit PostgreSQL search path:

- `public`
- `pg_temp`

This clears Supabase's mutable-function-search-path security warning.

## Operational indexes

V257 adds targeted indexes for the workflows introduced in recent releases:

- resident creator linkage
- case ownership/status
- case activity timeline
- permanent case notes
- applications by case
- applications by assigned officer/stage/follow-up
- appointments by case
- appointments by assigned officer/start time
- correspondence by linked case/reference
- field visits by linked case/reference
- field visits by lead officer/status/schedule
- resident feedback by case reference

Supabase's unindexed-foreign-key advisory count dropped from 51 to 42 after this hardening pass.

## Direct Supabase API isolation

The application remains server-mediated: resident/case data is accessed through the Node server's PostgreSQL connection, not through browser-side Supabase clients.

Supabase currently reports RLS disabled on:
- `public.residents`
- `public.public_content_revisions`

However, direct role checks confirm that `anon` and `authenticated` do not currently have direct SELECT/INSERT/UPDATE privileges on those sensitive tables.

V257 adds a live readiness check:

- `directApiIsolation`

It fails when `anon` or `authenticated` receive direct DML privileges on either sensitive table.

## Resident schema readiness

The existing `residentProfiles` readiness gate remains and verifies:
- `public.residents` exists
- `public.cases.resident_id` exists

## Staff diagnostics

System Administration, Production Control and Release Control now show both checks explicitly:

- Resident profile schema
- Direct API isolation

This makes resident-data protection visible rather than hidden behind a generic readiness result.

## Backend release identity

The server package version is now `257.0.0`.

## Deployment

Render is configured to run:

`cd server && npm run migrate && npm start`

on service startup.

Because migration 008 has already been recorded in the app migration ledger, the next Render restart/deploy should skip it cleanly.

## Verification completed

The connected Supabase project is ACTIVE_HEALTHY.

Confirmed:
- migration 007 is applied
- migration 008 is applied
- one existing case is linked to one Resident Profile
- all V257 indexes exist
- the mutable-function-search-path warning is resolved
- direct anon/authenticated resident/revision access is not granted

## Remaining RLS decision

Supabase still advises enabling Row Level Security on `residents` and `public_content_revisions`.

That remediation is intentionally not auto-applied because RLS policy design is an access-policy decision. The current server-only architecture is protected by revoked direct client privileges, which V257 now checks continuously.

## Production boundary

Technical hardening and readiness evidence do not constitute final production authorization. Confidential resident data still requires approved hosting, backups, retention, operational procedures, and THA IT / management authorization.
