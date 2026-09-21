ALTER TABLE cases ADD COLUMN IF NOT EXISTS community_area text;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS notification_consent boolean NOT NULL DEFAULT false;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS reminder_consent boolean NOT NULL DEFAULT false;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS submitted_document_metadata jsonb NOT NULL DEFAULT '[]'::jsonb;
CREATE INDEX IF NOT EXISTS cases_public_track_idx ON cases(reference,resident_visible);
