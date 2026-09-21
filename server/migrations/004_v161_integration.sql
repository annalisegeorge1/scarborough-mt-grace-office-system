ALTER TABLE documents ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
CREATE SEQUENCE IF NOT EXISTS correspondence_reference_seq START 1;
CREATE OR REPLACE FUNCTION next_correspondence_reference() RETURNS text LANGUAGE sql AS $$
 SELECT 'SMG-COR-'||to_char(CURRENT_DATE,'YYYY')||'-'||lpad(nextval('correspondence_reference_seq')::text,6,'0')
$$;
ALTER TABLE correspondences ALTER COLUMN correspondence_reference SET DEFAULT next_correspondence_reference();
UPDATE correspondences SET correspondence_reference=next_correspondence_reference() WHERE correspondence_reference IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS correspondences_reference_idx ON correspondences(correspondence_reference) WHERE correspondence_reference IS NOT NULL;

CREATE TABLE IF NOT EXISTS quality_standards(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), service_name text NOT NULL, target_text text NOT NULL, owner_user_id uuid REFERENCES users(id),
 review_frequency text, measurement_rule text, status text NOT NULL DEFAULT 'Active', created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS quality_reviews(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), review_date date NOT NULL DEFAULT CURRENT_DATE, sample_reference text, reviewer_user_id uuid REFERENCES users(id),
 finding text NOT NULL, result text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS quality_actions(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), source text, action_text text NOT NULL, owner_user_id uuid REFERENCES users(id), priority text NOT NULL DEFAULT 'Standard',
 due_date date, status text NOT NULL DEFAULT 'Open', completion_evidence text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS management_reviews(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), review_date date NOT NULL DEFAULT CURRENT_DATE, evidence_considered text, decisions text, priorities text,
 next_review_date date, created_by uuid REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS staff_workspace_state(
 module_key text PRIMARY KEY, payload jsonb NOT NULL DEFAULT '{}'::jsonb, revision bigint NOT NULL DEFAULT 1,
 updated_by uuid REFERENCES users(id), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS field_visits_followup_idx ON field_visits(status,next_follow_up);
CREATE INDEX IF NOT EXISTS events_start_idx ON events(status,starts_at);
CREATE INDEX IF NOT EXISTS correspondence_workflow_idx ON correspondences(workflow,updated_at DESC);
CREATE INDEX IF NOT EXISTS feedback_status_idx ON resident_feedback(status,theme);
CREATE INDEX IF NOT EXISTS reminders_status_due_idx ON reminders(status,due_at);

CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at=now(); RETURN NEW; END $$;
DO $$ DECLARE t text; BEGIN
 FOR t IN SELECT unnest(ARRAY['documents','correspondences','community_matters','initiatives','field_visits','events','resident_feedback','service_recovery_actions','staff_roster_assignments','staff_operational_absences','staff_coverage_assignments','staff_continuity_handovers','quality_standards','quality_actions']) LOOP
  EXECUTE format('DROP TRIGGER IF EXISTS trg_touch_updated_at ON %I',t);
  EXECUTE format('CREATE TRIGGER trg_touch_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION touch_updated_at()',t);
 END LOOP;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS reminders_open_unique_idx ON reminders(linked_type,linked_reference,title) WHERE status='Open';
