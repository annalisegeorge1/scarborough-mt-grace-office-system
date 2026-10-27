# Cloudflare hosting — controlled preview (26 October 2026)

Branch: `cloudflare-worker-preview-2026-10-26`. **This is not a production cutover.** Leave `main`, Render and the live domain unchanged.

## What this preview achieves

- Public pages and approved public assets are served by **Cloudflare Workers Static Assets**.
- The existing Render backend continues to serve `/api/*` and the entire `/staff/*` tree through same-origin Worker forwarding.
- Protected staff HTML is **not published** as static Cloudflare assets; the existing Express session check remains the access control.
- A build allow-list intentionally excludes `server/`, the staff directory, docs, migrations, private records, and credentials.
- Asset injection is derived from `server/src/app.js` so existing public CSS/JS enhancements carry over.

**This does not yet remove Render.** A complete backend migration needs separate compatibility engineering and tests for PostgreSQL pooling, authentication/session cookies, rate limiting, document storage, background jobs and all Node dependencies.

## Cloudflare preview setup (account owner action)

1. Log into Cloudflare and open **Workers & Pages → Create application → Import a repository**.
2. Select GitHub repo `annalisegeorge1/scarborough-mt-grace-office-system` and branch `cloudflare-worker-preview-2026-10-26`.
3. Set the project name **scarborough-mt-grace-district-preview** (must match `wrangler.jsonc`).
4. Build command: `node cloudflare/build.mjs`. Deploy command: `npx wrangler deploy`. Root directory: repository root.
5. Under the Worker settings **Variables and Secrets**, set `BACKEND_ORIGIN` to the actual, verified HTTPS Render staging origin (without trailing slash). This is a host URL, never a database connection string or a password.
6. Optional for a domain cutover **after authorization only**: set `PUBLIC_ORIGIN` to `https://scarboroughmtgrace.page`, and update the backend's own `PUBLIC_ORIGIN` only at cutover time.

## Preview acceptance checklist

- [ ] Cloudflare build finishes and Workers preview URL is reachable.
- [ ] Home, Office, Services, Community, Forms, Updates, Contact visually match the current staging website, including mobile.
- [ ] CSS/JS assets, images, icons, PWA and offline page load.
- [ ] /server/ and backend source files are **404**.
- [ ] /staff/home.html without a valid session redirects to staff login.
- [ ] Staff login works and protected /api endpoints enforce authorization and CSRF.
- [ ] Public enquiry creates a record, resident tracking matches a case safely, and publishing updates appear.
- [ ] No cookies, sessions or resident records are accessible across users.
- [ ] Logging, rate limits, error handling, restores/backups and rollback are tested.
- [ ] Operational and THA IT/management approval is documented before any real resident data or production DNS cutover.

## Rollback

The production domain stays on its existing origin. Delete/disable the preview Worker without changing DNS. Do not stop or delete the Render backend until a separately tested Cloudflare-compatible backend exists.

## Notes

The 16.9 MB public HTML shell is within Cloudflare Workers' current per-static-asset limit of 25 MiB, but it remains a performance issue that should be addressed without destabilizing the site. The preview is deliberately separated from `main` to respect feature freeze and release-control rules.
