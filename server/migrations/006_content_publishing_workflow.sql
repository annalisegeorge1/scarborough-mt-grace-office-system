-- V242 — Staff publishing workflow, preview metadata and revision history.
-- Backward-compatible: the existing public endpoint still exposes only explicit
-- resident-safe fields and only Published + Verified + in-window records.

ALTER TABLE public_content ADD COLUMN IF NOT EXISTS internal_notes text;
ALTER TABLE public_content ADD COLUMN IF NOT EXISTS source_reference text;
ALTER TABLE public_content ADD COLUMN IF NOT EXISTS verification_note text;
ALTER TABLE public_content ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES users(id);
ALTER TABLE public_content ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;
ALTER TABLE public_content ADD COLUMN IF NOT EXISTS verified_by uuid REFERENCES users(id);
ALTER TABLE public_content ADD COLUMN IF NOT EXISTS verified_at timestamptz;
ALTER TABLE public_content ADD COLUMN IF NOT EXISTS published_by uuid REFERENCES users(id);
ALTER TABLE public_content ADD COLUMN IF NOT EXISTS published_at timestamptz;
ALTER TABLE public_content ADD COLUMN IF NOT EXISTS archived_by uuid REFERENCES users(id);
ALTER TABLE public_content ADD COLUMN IF NOT EXISTS archived_at timestamptz;
ALTER TABLE public_content ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;
ALTER TABLE public_content ADD COLUMN IF NOT EXISTS published_snapshot jsonb;
ALTER TABLE public_content ADD COLUMN IF NOT EXISTS published_snapshot_at timestamptz;
ALTER TABLE public_content ADD COLUMN IF NOT EXISTS published_snapshot_active boolean NOT NULL DEFAULT false;

UPDATE public_content
SET published_at=COALESCE(publish_on,updated_at)
WHERE workflow='Published' AND published_at IS NULL;

UPDATE public_content
SET verified_at=updated_at
WHERE verified=true AND verified_at IS NULL;

UPDATE public_content
SET
  published_snapshot=jsonb_build_object(
    'id',id,
    'type',type,
    'section',section,
    'category',category,
    'title',title,
    'summary',summary,
    'body',body,
    'publicUrl',public_url,
    'publicStatus',public_status,
    'statusNote',status_note,
    'responsibleAuthority',responsible_authority,
    'eventDate',event_date,
    'sortOrder',sort_order,
    'documentId',document_id,
    'isFeatured',is_featured,
    'metadata',metadata,
    'publishOn',publish_on,
    'expireOn',expire_on,
    'updatedAt',updated_at
  ),
  published_snapshot_at=COALESCE(published_at,publish_on,updated_at),
  published_snapshot_active=true
WHERE workflow='Published'
  AND verified=true
  AND published_snapshot IS NULL;

CREATE TABLE IF NOT EXISTS public_content_revisions(
  id bigserial PRIMARY KEY,
  content_id uuid NOT NULL REFERENCES public_content(id) ON DELETE CASCADE,
  version integer NOT NULL,
  action text NOT NULL,
  workflow text NOT NULL,
  verified boolean NOT NULL,
  public_payload jsonb NOT NULL,
  internal_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  actor_user_id uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(content_id,version)
);

CREATE INDEX IF NOT EXISTS public_content_revision_content_idx
  ON public_content_revisions(content_id,version DESC);

CREATE INDEX IF NOT EXISTS public_content_workflow_idx
  ON public_content(workflow,verified,updated_at DESC);

-- Give existing records a revision baseline so the Publishing Desk has a clear
-- starting point. Later V242 edits add one revision per content version.
INSERT INTO public_content_revisions(
  content_id,version,action,workflow,verified,public_payload,internal_payload,actor_user_id,created_at
)
SELECT
  pc.id,
  pc.version,
  'baseline',
  pc.workflow,
  pc.verified,
  jsonb_build_object(
    'id',pc.id,
    'type',pc.type,
    'section',pc.section,
    'category',pc.category,
    'title',pc.title,
    'summary',pc.summary,
    'body',pc.body,
    'publicUrl',pc.public_url,
    'publicStatus',pc.public_status,
    'statusNote',pc.status_note,
    'responsibleAuthority',pc.responsible_authority,
    'eventDate',pc.event_date,
    'sortOrder',pc.sort_order,
    'documentId',pc.document_id,
    'isFeatured',pc.is_featured,
    'metadata',pc.metadata,
    'publishOn',pc.publish_on,
    'expireOn',pc.expire_on,
    'updatedAt',pc.updated_at
  ),
  jsonb_build_object(
    'internalNotes',pc.internal_notes,
    'sourceReference',pc.source_reference,
    'verificationNote',pc.verification_note
  ),
  pc.created_by,
  pc.updated_at
FROM public_content pc
ON CONFLICT (content_id,version) DO NOTHING;
