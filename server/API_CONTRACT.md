# V160 Production API Contract

All authenticated state-changing requests use the `smg_session` HttpOnly cookie and must include the current `X-SMG-CSRF` token returned by `/api/auth/login` or `/api/auth/me`.

## Public
- `POST /api/public/enquiries` — creates a central case and returns the official reference.
- `POST /api/public/track` — requires reference + matching phone/email; returns only approved public case fields.
- `POST /api/public/feedback` — requires reference + matching contact before service feedback is accepted.
- `GET /api/health` — application/database health.
- `GET /api/health/readiness` — infrastructure readiness gates.

## Authentication
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout` — requires CSRF.

## Staff operations
- `GET|POST|PUT /api/cases[/:id]`
- `GET|POST|PATCH /api/applications[/:id]`
- `GET|POST /api/records`
- `POST /api/uploads` — authenticated private file upload; production blocked until approved private storage is configured.
- `GET|PATCH /api/feedback[/:id]`
- `GET|POST /api/content`
- `GET /api/audit`
- `GET /api/search?q=...`
- `GET|POST /api/users` — Manager only.

Authorization is always server-side. Hiding a button in HTML is never treated as access control.
