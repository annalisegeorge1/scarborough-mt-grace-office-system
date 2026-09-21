# Private Repository Setup

Render deploys most cleanly from a Git repository. Keep the repository private because the project contains backend configuration and operational implementation details, even though it contains no real secrets.

The `.gitignore` in V163 excludes environment files, database dumps, local private storage, logs and installed dependencies.

Recommended first commit:

```bash
git init
git add .
git commit -m "V163 zero-cost staging deployment candidate"
```

Then connect that private repository to Render and select the root `render.yaml` Blueprint.

Never commit a populated `.env` file or database password.
