-- V263: central meeting operations
CREATE SEQUENCE IF NOT EXISTS meeting_reference_seq START 1;

CREATE OR REPLACE FUNCTION next_meeting_reference()
RETURNS text
LANGUAGE sql
SET search_path TO public, pg_temp
AS $$
  SELECT 'SMG-MTG-'||to_char(CURRENT_DATE,'YYYY')||'-'||lpad(nextval('meeting_reference_seq')::text,5,'0')
$$;

CREATE TABLE IF NOT EXISTS meetings(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text UNIQUE NOT NULL DEFAULT next_meeting_reference(),
  meeting_type text NOT NULL,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'Planning',
  area text,
  meeting_date date NOT NULL,
  start_time time,
  venue text,
  lead_text text,
  recorder_text text,
  linked_type text,
  linked_reference text,
  purpose text,
  agenda text,
  internal_minutes text,
  decisions text,
  public_summary text,
  next_follow_up date,
  created_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS meeting_attendance(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  attendee_name text NOT NULL,
  organization text,
  role_category text,
  recorded_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS meeting_actions(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  action_text text NOT NULL,
  owner_text text,
  owner_user_id uuid REFERENCES users(id),
  due_date date,
  status text NOT NULL DEFAULT 'Open',
  linked_reference text,
  created_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS meeting_timeline(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  note text,
  actor_user_id uuid REFERENCES users(id),
  occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS meetings_date_status_idx ON meetings(meeting_date DESC,status);
CREATE INDEX IF NOT EXISTS meetings_followup_idx ON meetings(next_follow_up);
CREATE INDEX IF NOT EXISTS meetings_link_idx ON meetings(linked_type,linked_reference);
CREATE INDEX IF NOT EXISTS meeting_attendance_meeting_idx ON meeting_attendance(meeting_id,created_at);
CREATE INDEX IF NOT EXISTS meeting_actions_meeting_status_idx ON meeting_actions(meeting_id,status,due_date);
CREATE INDEX IF NOT EXISTS meeting_actions_owner_idx ON meeting_actions(owner_user_id,status,due_date);
CREATE INDEX IF NOT EXISTS meeting_timeline_meeting_time_idx ON meeting_timeline(meeting_id,occurred_at DESC);

DROP TRIGGER IF EXISTS trg_touch_updated_at ON meetings;
CREATE TRIGGER trg_touch_updated_at
BEFORE UPDATE ON meetings
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_touch_updated_at ON meeting_actions;
CREATE TRIGGER trg_touch_updated_at
BEFORE UPDATE ON meeting_actions
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
