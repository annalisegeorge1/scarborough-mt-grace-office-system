# First Manager Account

V163 uses the existing secure server-side password hashing and role model.

During initial Render Blueprint creation, provide three secret values:

- `BOOTSTRAP_ADMIN_EMAIL`
- `BOOTSTRAP_ADMIN_NAME`
- `BOOTSTRAP_ADMIN_PASSWORD`

The password must be at least 12 characters and should be unique to this staging environment.

The Render Blueprint's `initialDeployHook` runs the existing `npm run seed:admin` command once after the first successful deploy.

After confirming that the Manager can sign in:

1. Delete `BOOTSTRAP_ADMIN_PASSWORD` from the Render environment.
2. Keep the Manager account itself in PostgreSQL.
3. Create other staff accounts from the authenticated administration interface.
4. Never share one staff account among multiple people.

Do not place the password in Git, a ZIP filename, a document, a WhatsApp message, or a public issue tracker.
