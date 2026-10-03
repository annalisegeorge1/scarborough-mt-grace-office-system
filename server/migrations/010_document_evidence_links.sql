-- V266: secondary evidence links for one document -> many work records
CREATE TABLE IF NOT EXISTS document_links(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  linked_type text NOT NULL,
  linked_id text NOT NULL,
  relationship text NOT NULL DEFAULT 'Evidence',
  created_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK(length(trim(linked_type))>0),
  CHECK(length(trim(linked_id))>0)
);

CREATE UNIQUE INDEX IF NOT EXISTS document_links_unique_idx
  ON document_links(document_id,lower(linked_type),linked_id);

CREATE INDEX IF NOT EXISTS document_links_target_idx
  ON document_links(lower(linked_type),linked_id,created_at DESC);

CREATE INDEX IF NOT EXISTS document_links_document_idx
  ON document_links(document_id,created_at DESC);

INSERT INTO document_links(document_id,linked_type,linked_id,relationship,created_by)
SELECT d.id,d.linked_type,d.linked_id,'Primary',d.uploaded_by
FROM documents d
WHERE d.linked_type IS NOT NULL
  AND trim(d.linked_type)<>''
  AND d.linked_id IS NOT NULL
  AND trim(d.linked_id)<>''
ON CONFLICT DO NOTHING;

REVOKE ALL ON TABLE document_links FROM anon,authenticated;
