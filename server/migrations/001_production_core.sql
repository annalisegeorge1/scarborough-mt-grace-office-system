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
