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
