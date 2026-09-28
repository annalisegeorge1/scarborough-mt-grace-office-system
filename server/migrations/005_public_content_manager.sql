-- V202 — Staff-controlled public Forms Library and District Activity Hub.
-- Backward-compatible: existing static website content remains the fallback until
-- staff publish overrides or managed items.

ALTER TABLE public_content ADD COLUMN IF NOT EXISTS section text;
ALTER TABLE public_content ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE public_content ADD COLUMN IF NOT EXISTS public_status text;
ALTER TABLE public_content ADD COLUMN IF NOT EXISTS status_note text;
ALTER TABLE public_content ADD COLUMN IF NOT EXISTS responsible_authority text;
ALTER TABLE public_content ADD COLUMN IF NOT EXISTS event_date timestamptz;
ALTER TABLE public_content ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;
ALTER TABLE public_content ADD COLUMN IF NOT EXISTS document_id uuid REFERENCES documents(id) ON DELETE SET NULL;
ALTER TABLE public_content ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;
ALTER TABLE public_content ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS public_content_public_idx
  ON public_content(section, workflow, verified, publish_on, expire_on);

CREATE INDEX IF NOT EXISTS public_content_document_idx
  ON public_content(document_id)
  WHERE document_id IS NOT NULL;
