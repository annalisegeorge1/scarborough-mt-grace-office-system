CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE IF NOT EXISTS schema_migrations(version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS roles(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text UNIQUE NOT NULL);
INSERT INTO roles(name) VALUES ('Manager'),('Administrative'),('Senior Officer'),('Field Officer'),('Senior Staff') ON CONFLICT DO NOTHING;
CREATE TABLE IF NOT EXISTS users(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email text UNIQUE NOT NULL, display_name text NOT NULL,
 role_id uuid NOT NULL REFERENCES roles(id), password_hash text NOT NULL, is_active boolean NOT NULL DEFAULT true,
 mfa_required boolean NOT NULL DEFAULT false, password_changed_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS sessions(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 token_hash text UNIQUE NOT NULL, csrf_token text NOT NULL, idle_expires_at timestamptz NOT NULL,
 absolute_expires_at timestamptz NOT NULL, last_seen_at timestamptz NOT NULL DEFAULT now(),
 ip_address inet, user_agent text, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id);
CREATE INDEX IF NOT EXISTS sessions_expiry_idx ON sessions(idle_expires_at,absolute_expires_at);

CREATE SEQUENCE IF NOT EXISTS case_reference_seq START 1;
CREATE OR REPLACE FUNCTION next_case_reference() RETURNS text LANGUAGE sql AS $$
 SELECT 'SMG-'||to_char(CURRENT_DATE,'YYYY')||'-'||lpad(nextval('case_reference_seq')::text,6,'0')
$$;
CREATE TABLE IF NOT EXISTS cases(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), reference text UNIQUE NOT NULL DEFAULT next_case_reference(),
 status text NOT NULL DEFAULT 'New', priority text NOT NULL DEFAULT 'Standard', category text,
 resident_name text, phone text, email text, date_of_birth date, address text, preferred_contact text,
 enquiry_message text, assigned_user_id uuid REFERENCES users(id), case_owner_user_id uuid REFERENCES users(id),
 next_follow_up date, due_date date, escalation text NOT NULL DEFAULT 'Normal', next_action text,
 referral_agency text, referral_reference text, referral_date date, referral_purpose text, referral_contact text,
 referral_ack_date date, referral_response_status text, referral_follow_up_date date, referral_response_note text,
 closure_reason text, public_status text NOT NULL DEFAULT 'Received', public_update text, public_next_step text,
 public_updated_at timestamptz, resident_visible boolean NOT NULL DEFAULT true,
 created_by uuid REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), closed_at timestamptz
);
CREATE INDEX IF NOT EXISTS cases_status_idx ON cases(status);
CREATE INDEX IF NOT EXISTS cases_assigned_idx ON cases(assigned_user_id,status);
CREATE INDEX IF NOT EXISTS cases_reference_idx ON cases(reference);
CREATE TABLE IF NOT EXISTS case_activity(
 id bigserial PRIMARY KEY, case_id uuid NOT NULL REFERENCES cases(id) ON DELETE CASCADE, occurred_at timestamptz NOT NULL DEFAULT now(),
 actor_user_id uuid REFERENCES users(id), activity_type text NOT NULL, description text NOT NULL, public_visible boolean NOT NULL DEFAULT false
);
CREATE TABLE IF NOT EXISTS case_notes(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), case_id uuid NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
 author_user_id uuid REFERENCES users(id), note_text text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);

CREATE SEQUENCE IF NOT EXISTS application_reference_seq START 1;
CREATE OR REPLACE FUNCTION next_application_reference() RETURNS text LANGUAGE sql AS $$
 SELECT 'SMG-APP-'||to_char(CURRENT_DATE,'YYYY')||'-'||lpad(nextval('application_reference_seq')::text,6,'0')
$$;
CREATE TABLE IF NOT EXISTS applications(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), reference text UNIQUE NOT NULL DEFAULT next_application_reference(), case_id uuid REFERENCES cases(id),
 applicant_name text NOT NULL, assistance_type text NOT NULL, agency text, stage text NOT NULL DEFAULT 'Intake',
 assigned_user_id uuid REFERENCES users(id), agency_reference text, submission_date date, acknowledgement_date date,
 next_follow_up date, outcome text, outcome_date date, public_status text, public_note text, internal_note text,
 created_by uuid REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS applications_stage_idx ON applications(stage,next_follow_up);
CREATE TABLE IF NOT EXISTS application_checklist(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), application_id uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
 item_label text NOT NULL, status text NOT NULL DEFAULT 'Needed', note text, updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(application_id,item_label)
);
CREATE TABLE IF NOT EXISTS application_timeline(
 id bigserial PRIMARY KEY, application_id uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
 occurred_at timestamptz NOT NULL DEFAULT now(), actor_user_id uuid REFERENCES users(id), event_type text NOT NULL, description text NOT NULL
);

CREATE SEQUENCE IF NOT EXISTS record_reference_seq START 1;
CREATE OR REPLACE FUNCTION next_record_reference() RETURNS text LANGUAGE sql AS $$
 SELECT 'SMG-REC-'||to_char(CURRENT_DATE,'YYYY')||'-'||lpad(nextval('record_reference_seq')::text,6,'0')
$$;
CREATE TABLE IF NOT EXISTS documents(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), record_reference text UNIQUE NOT NULL DEFAULT next_record_reference(), title text NOT NULL,
 document_type text, sensitivity text NOT NULL DEFAULT 'Internal', storage_key text, original_filename text, mime_type text, size_bytes bigint,
 sha256 text, linked_type text, linked_id text, review_status text NOT NULL DEFAULT 'Needs Review', retention_class text,
 review_date date, expiry_date date, uploaded_by uuid REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS documents_link_idx ON documents(linked_type,linked_id);

CREATE TABLE IF NOT EXISTS correspondences(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), correspondence_reference text UNIQUE, template_key text, linked_type text, linked_reference text,
 recipient_name text, recipient_address text, subject text NOT NULL, body_text text NOT NULL, signatory text,
 workflow text NOT NULL DEFAULT 'Draft', issued_at timestamptz, document_id uuid REFERENCES documents(id), created_by uuid REFERENCES users(id),
 approved_by uuid REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS appointments(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), case_id uuid REFERENCES cases(id), application_id uuid REFERENCES applications(id),
 appointment_type text NOT NULL, starts_at timestamptz NOT NULL, ends_at timestamptz, assigned_user_id uuid REFERENCES users(id),
 location text, status text NOT NULL DEFAULT 'Scheduled', note text, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS community_matters(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL, matter_type text, area text, priority text NOT NULL DEFAULT 'Standard',
 status text NOT NULL DEFAULT 'Identified', responsible_user_id uuid REFERENCES users(id), agency text, next_follow_up date,
 public_visible boolean NOT NULL DEFAULT false, public_summary text, public_next_step text, internal_notes text,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS case_matter_links(case_id uuid REFERENCES cases(id) ON DELETE CASCADE,matter_id uuid REFERENCES community_matters(id) ON DELETE CASCADE,PRIMARY KEY(case_id,matter_id));
CREATE TABLE IF NOT EXISTS initiatives(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL, type text NOT NULL, stage text NOT NULL DEFAULT 'Planned', area text,
 lead_user_id uuid REFERENCES users(id), responsible_agency text, start_date date, target_date date, next_follow_up date,
 public_visible boolean NOT NULL DEFAULT false, public_summary text, internal_notes text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS partners(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, partner_type text, area_served text, contact_name text, phone text, email text,
 agreement_status text, next_follow_up date, internal_note text, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS field_visits(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), visit_type text NOT NULL, linked_type text, linked_reference text, lead_user_id uuid REFERENCES users(id),
 additional_staff text, scheduled_at timestamptz, completed_at timestamptz, location_text text, purpose text, internal_observations text,
 public_outcome text, outcome_category text, next_action text, next_follow_up date, evidence_reference text, status text NOT NULL DEFAULT 'Planned',
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS events(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), event_type text NOT NULL, title text NOT NULL, status text NOT NULL DEFAULT 'Planned', starts_at timestamptz,
 venue text, lead_user_id uuid REFERENCES users(id), linked_type text, linked_reference text, expected_attendance integer,
 actual_attendance integer, public_summary text, internal_notes text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS event_actions(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE, action_text text NOT NULL,
 owner_user_id uuid REFERENCES users(id), due_date date, status text NOT NULL DEFAULT 'Open', linked_reference text, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS event_attendance(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
 attendee_name text NOT NULL, participant_type text, organization text, contact_note text, created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS resident_feedback(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), case_reference text, feedback_type text NOT NULL, theme text, rating integer CHECK(rating BETWEEN 1 AND 5),
 clarity_rating integer CHECK(clarity_rating BETWEEN 1 AND 5), respect_rating integer CHECK(respect_rating BETWEEN 1 AND 5),
 details text, follow_up_requested boolean NOT NULL DEFAULT false, owner_user_id uuid REFERENCES users(id), status text NOT NULL DEFAULT 'Open',
 source text NOT NULL DEFAULT 'Staff', created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS service_recovery_actions(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), feedback_id uuid REFERENCES resident_feedback(id) ON DELETE SET NULL, action_text text NOT NULL,
 owner_user_id uuid REFERENCES users(id), priority text NOT NULL DEFAULT 'Standard', due_date date, status text NOT NULL DEFAULT 'Open',
 outcome_note text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public_content(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), type text NOT NULL, title text NOT NULL, summary text, body text, public_url text,
 workflow text NOT NULL DEFAULT 'Draft', verified boolean NOT NULL DEFAULT false, publish_on timestamptz, expire_on timestamptz,
 created_by uuid REFERENCES users(id), approved_by uuid REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS automation_rules(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, record_type text NOT NULL, trigger_type text NOT NULL, lead_days integer NOT NULL DEFAULT 0,
 priority text NOT NULL DEFAULT 'Standard', enabled boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS reminders(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), rule_id uuid REFERENCES automation_rules(id), linked_type text, linked_reference text,
 title text NOT NULL, due_at timestamptz, priority text NOT NULL DEFAULT 'Standard', status text NOT NULL DEFAULT 'Open', assigned_user_id uuid REFERENCES users(id),
 created_at timestamptz NOT NULL DEFAULT now(), resolved_at timestamptz
);

CREATE TABLE IF NOT EXISTS staff_roster_assignments(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid REFERENCES users(id),duty_date date NOT NULL,duty_status text NOT NULL,start_time time,end_time time,primary_duty text,operational_notes text,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS staff_operational_absences(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid REFERENCES users(id),start_date date NOT NULL,end_date date NOT NULL,category text NOT NULL,operational_status text NOT NULL,coverage_required boolean NOT NULL DEFAULT false,operational_note text,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),CHECK(end_date>=start_date));
CREATE TABLE IF NOT EXISTS staff_coverage_assignments(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),unavailable_user_id uuid REFERENCES users(id),covering_user_id uuid REFERENCES users(id),start_date date NOT NULL,end_date date NOT NULL,responsibilities text,linked_references text,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),CHECK(end_date>=start_date),CHECK(unavailable_user_id IS DISTINCT FROM covering_user_id));
CREATE TABLE IF NOT EXISTS staff_continuity_handovers(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),from_user_id uuid REFERENCES users(id),to_user_id uuid REFERENCES users(id),handover_date date NOT NULL,review_or_return_date date,outstanding_work text NOT NULL,linked_references text,next_action text,priority text NOT NULL DEFAULT 'Normal',status text NOT NULL DEFAULT 'Open',created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now());

CREATE TABLE IF NOT EXISTS audit_log(
 id bigserial PRIMARY KEY, occurred_at timestamptz NOT NULL DEFAULT now(), actor_user_id uuid REFERENCES users(id), event_type text NOT NULL,
 object_type text, object_id text, outcome text NOT NULL DEFAULT 'success', metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS audit_log_actor_time_idx ON audit_log(actor_user_id,occurred_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_object_idx ON audit_log(object_type,object_id,occurred_at DESC);
ALTER TABLE cases ADD COLUMN IF NOT EXISTS community_area text;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS notification_consent boolean NOT NULL DEFAULT false;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS reminder_consent boolean NOT NULL DEFAULT false;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS submitted_document_metadata jsonb NOT NULL DEFAULT '[]'::jsonb;
CREATE INDEX IF NOT EXISTS cases_public_track_idx ON cases(reference,resident_visible);
CREATE OR REPLACE FUNCTION smg_touch_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at=now(); RETURN NEW; END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='cases_status_check') THEN
    ALTER TABLE cases ADD CONSTRAINT cases_status_check CHECK (status IN ('New','Unassigned','Assigned','In Progress','Awaiting Documents','Referred','Completed','Closed'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='cases_priority_check') THEN
    ALTER TABLE cases ADD CONSTRAINT cases_priority_check CHECK (priority IN ('Urgent','High','Standard','Low'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='cases_escalation_check') THEN
    ALTER TABLE cases ADD CONSTRAINT cases_escalation_check CHECK (escalation IN ('Normal','Manager Review','Critical'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='public_content_workflow_check') THEN
    ALTER TABLE public_content ADD CONSTRAINT public_content_workflow_check CHECK (workflow IN ('Draft','In Review','Approved','Published','Archived'));
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_uidx ON users(lower(email));
CREATE INDEX IF NOT EXISTS cases_follow_up_idx ON cases(next_follow_up) WHERE status NOT IN ('Completed','Closed');
CREATE INDEX IF NOT EXISTS applications_follow_up_idx ON applications(next_follow_up) WHERE stage <> 'Closed';
CREATE INDEX IF NOT EXISTS documents_review_idx ON documents(review_status,review_date);
CREATE INDEX IF NOT EXISTS community_follow_up_idx ON community_matters(next_follow_up,status);
CREATE INDEX IF NOT EXISTS field_follow_up_idx ON field_visits(next_follow_up,status);
CREATE INDEX IF NOT EXISTS feedback_status_idx ON resident_feedback(status,created_at DESC);
CREATE INDEX IF NOT EXISTS reminders_due_idx ON reminders(status,due_at);

DROP TRIGGER IF EXISTS trg_users_touch ON users; CREATE TRIGGER trg_users_touch BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION smg_touch_updated_at();
DROP TRIGGER IF EXISTS trg_cases_touch ON cases; CREATE TRIGGER trg_cases_touch BEFORE UPDATE ON cases FOR EACH ROW EXECUTE FUNCTION smg_touch_updated_at();
DROP TRIGGER IF EXISTS trg_applications_touch ON applications; CREATE TRIGGER trg_applications_touch BEFORE UPDATE ON applications FOR EACH ROW EXECUTE FUNCTION smg_touch_updated_at();
DROP TRIGGER IF EXISTS trg_community_touch ON community_matters; CREATE TRIGGER trg_community_touch BEFORE UPDATE ON community_matters FOR EACH ROW EXECUTE FUNCTION smg_touch_updated_at();
DROP TRIGGER IF EXISTS trg_initiatives_touch ON initiatives; CREATE TRIGGER trg_initiatives_touch BEFORE UPDATE ON initiatives FOR EACH ROW EXECUTE FUNCTION smg_touch_updated_at();
DROP TRIGGER IF EXISTS trg_field_touch ON field_visits; CREATE TRIGGER trg_field_touch BEFORE UPDATE ON field_visits FOR EACH ROW EXECUTE FUNCTION smg_touch_updated_at();
DROP TRIGGER IF EXISTS trg_events_touch ON events; CREATE TRIGGER trg_events_touch BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION smg_touch_updated_at();
DROP TRIGGER IF EXISTS trg_correspondence_touch ON correspondences; CREATE TRIGGER trg_correspondence_touch BEFORE UPDATE ON correspondences FOR EACH ROW EXECUTE FUNCTION smg_touch_updated_at();
DROP TRIGGER IF EXISTS trg_feedback_touch ON resident_feedback; CREATE TRIGGER trg_feedback_touch BEFORE UPDATE ON resident_feedback FOR EACH ROW EXECUTE FUNCTION smg_touch_updated_at();
DROP TRIGGER IF EXISTS trg_recovery_touch ON service_recovery_actions; CREATE TRIGGER trg_recovery_touch BEFORE UPDATE ON service_recovery_actions FOR EACH ROW EXECUTE FUNCTION smg_touch_updated_at();
DROP TRIGGER IF EXISTS trg_content_touch ON public_content; CREATE TRIGGER trg_content_touch BEFORE UPDATE ON public_content FOR EACH ROW EXECUTE FUNCTION smg_touch_updated_at();

-- V161 integration additions. For production deployments, use scripts/migrate.js and migrations/*.sql as the authoritative migration sequence.
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

