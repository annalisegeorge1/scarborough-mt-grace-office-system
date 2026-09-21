# Staging and Release Process — V162

## Environments
Use separate **development**, **staging**, and **production** environments. Staging should resemble production but use separate credentials, a separate database, and non-production/test data.

## Release path
1. Build a versioned package.
2. Run static release QA.
3. Deploy to staging.
4. Apply migrations to staging.
5. Run preflight and smoke tests.
6. Run staff UAT and permission checks.
7. Record approval in change control.
8. Create a production backup.
9. Deploy the same approved artifact to production.
10. Run immediate production smoke tests.
11. Record release result and monitor incidents.

Never make untested changes directly on the production server. Emergency fixes should still be versioned, reviewed, and followed by a formal release record.
