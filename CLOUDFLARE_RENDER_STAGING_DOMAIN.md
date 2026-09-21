# Cloudflare + Render Staging Domain

Do not move the main public domain until the generated Render URL has passed staging tests.

A safe first custom-domain target is:

`staging.scarboroughmtgrace.page`

## After the Render service is healthy

1. Add `staging.scarboroughmtgrace.page` to the Render service under Custom Domains.
2. In Cloudflare DNS, create the CNAME value Render provides.
3. Keep the Cloudflare record **DNS only** while Render verifies the domain and issues TLS.
4. Confirm Render shows a valid certificate.
5. Test the staging domain over HTTPS.
6. Set `PUBLIC_ORIGIN=https://staging.scarboroughmtgrace.page` in Render.
7. Redeploy and run smoke tests again.

Do not point the root domain to staging during this phase.
