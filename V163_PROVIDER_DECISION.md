# Current Hosting Decision — September 2026

## Selected for zero-cost staging

**Application:** Render Free Web Service  
**Database:** Supabase Free Postgres  
**DNS:** existing Cloudflare zone, initially unchanged  
**Uploads:** disabled

## Why Render Free Postgres was not selected

Render's free Postgres database expires after 30 days. That makes it unsuitable as the staging database for a project that may need repeated testing over a longer period.

## Why Railway was not selected as the first route

Railway's Free plan provides only a small monthly usage credit after the initial trial. It can be useful, but its economics are less predictable for an always-available Node service and database than a deliberately sleeping free staging service.

## Why Koyeb was not selected as the first route

Koyeb offers a free web instance, but its free database compute allocation is heavily limited. It remains a possible alternate application host, but the Render + Supabase pairing has clearer deployment documentation for this particular stack.

## Important production warning

None of these free tiers should be treated as the final confidential production environment simply because they can technically run the software. Final production needs dependable backups, appropriate availability, private document storage, malware scanning, monitoring and a supportable recovery plan.
