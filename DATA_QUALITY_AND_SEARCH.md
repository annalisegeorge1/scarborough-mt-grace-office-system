# Global Search & Data Quality

## Purpose
The Search Centre provides a single staff-facing discovery and quality-review layer across case, records, CMS, feedback and reminder training registers.

## Duplicate controls
Possible duplicates are signals only. Production merging must require an authorized staff decision, preserve all original identifiers, create an immutable audit event and retain a reversible merge history.

## Search permissions
Production search results must be filtered by the signed-in user's permissions. Restricted records and sensitive documents must not appear to unauthorized staff merely because a search term matches.

## Data quality
The training scanner flags missing identifiers, ownership, follow-up dates, referral agencies, document classifications and public-content verification. Official production validation should run server-side and before imports.
