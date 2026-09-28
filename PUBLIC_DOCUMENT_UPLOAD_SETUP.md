# Public enquiry supporting documents

The public form accepts up to three PDF, JPG, or PNG files per enquiry, each at most 12 MB. Files are malware scanned, stored in a private S3 compatible bucket, and linked to the case in the staff portal. Staff can see the document list in the case drawer and download files from **Staff → Records**. Public case tracking never exposes files.

The file picker remains unavailable until the server reports that uploads are ready. The existing JSON enquiry route cannot claim that document filenames are uploaded.

## Staging setup

1. In the Supabase project used for the office, create a **private** Storage bucket for case documents. Keep public access off. In **Storage → S3 Configuration**, enable S3 access and create server side access keys. Copy the endpoint and region shown there. S3 keys bypass Storage RLS, so enter them only in Render environment variables; never place them in the website or repository.
2. Provision a ClamAV `clamd` service reachable from the Render web service over a private network. Its `INSTREAM` service must be available at the chosen host and port. Do not accept public documents without a functioning scanner.
3. In the Render service, set `PRIVATE_STORAGE_DRIVER=s3`, `S3_BUCKET=<private bucket>`, `S3_ENDPOINT=<S3 endpoint>`, `S3_REGION=<region>`, `S3_ACCESS_KEY_ID=<key>`, `S3_SECRET_ACCESS_KEY=<secret>`, `S3_FORCE_PATH_STYLE=true`, `CLAMAV_HOST=<private scanner host>`, `CLAMAV_PORT=3310`, and `MALWARE_SCAN_REQUIRED=true`. Set `UPLOADS_ENABLED=true` only after the storage and scanner are ready. Keep the credential values private.
4. Redeploy and confirm `/api/public/upload-status` returns `enabled: true`. Submit a test enquiry with a harmless PDF. Verify its reference in the staff case list, its document under **Staff → Records**, and an authenticated download. Test an invalid file and an oversized file; neither should create a case.

The repository's `render.yaml` defaults keep uploads disabled. Render's free web service has no persistent private disk, and these steps require a separate private scanner service. If those services are unavailable, leave uploads disabled and continue collecting enquiries without attachments.
