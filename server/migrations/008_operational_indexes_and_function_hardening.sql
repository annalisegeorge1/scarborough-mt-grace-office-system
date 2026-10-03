-- V257: operational indexes and safe function search-path hardening
ALTER FUNCTION public.next_resident_reference() SET search_path TO public, pg_temp;

CREATE INDEX IF NOT EXISTS residents_created_by_idx
  ON public.residents(created_by);

CREATE INDEX IF NOT EXISTS cases_owner_status_idx
  ON public.cases(case_owner_user_id,status);

CREATE INDEX IF NOT EXISTS case_activity_case_time_idx
  ON public.case_activity(case_id,occurred_at DESC);

CREATE INDEX IF NOT EXISTS case_notes_case_time_idx
  ON public.case_notes(case_id,created_at DESC);

CREATE INDEX IF NOT EXISTS applications_case_idx
  ON public.applications(case_id,updated_at DESC);

CREATE INDEX IF NOT EXISTS applications_assigned_stage_idx
  ON public.applications(assigned_user_id,stage,next_follow_up);

CREATE INDEX IF NOT EXISTS appointments_case_start_idx
  ON public.appointments(case_id,starts_at DESC);

CREATE INDEX IF NOT EXISTS appointments_assigned_start_idx
  ON public.appointments(assigned_user_id,starts_at);

CREATE INDEX IF NOT EXISTS correspondences_link_idx
  ON public.correspondences(linked_type,linked_reference,updated_at DESC);

CREATE INDEX IF NOT EXISTS field_visits_link_idx
  ON public.field_visits(linked_type,linked_reference,updated_at DESC);

CREATE INDEX IF NOT EXISTS field_visits_lead_status_idx
  ON public.field_visits(lead_user_id,status,scheduled_at);

CREATE INDEX IF NOT EXISTS resident_feedback_case_idx
  ON public.resident_feedback(case_reference,updated_at DESC);
