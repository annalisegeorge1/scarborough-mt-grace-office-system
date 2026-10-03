CREATE SEQUENCE IF NOT EXISTS resident_reference_seq START 1;

CREATE OR REPLACE FUNCTION next_resident_reference() RETURNS text LANGUAGE sql AS $$
 SELECT 'SMG-RES-'||to_char(CURRENT_DATE,'YYYY')||'-'||lpad(nextval('resident_reference_seq')::text,6,'0')
$$;

CREATE TABLE IF NOT EXISTS residents(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 reference text UNIQUE NOT NULL DEFAULT next_resident_reference(),
 full_name text NOT NULL,
 phone text,
 email text,
 date_of_birth date,
 address text,
 preferred_contact text,
 household_name text,
 created_by uuid REFERENCES users(id),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS residents_name_idx ON residents(lower(full_name));
CREATE INDEX IF NOT EXISTS residents_phone_idx ON residents(phone);
CREATE INDEX IF NOT EXISTS residents_email_idx ON residents(lower(email));

ALTER TABLE cases ADD COLUMN IF NOT EXISTS resident_id uuid REFERENCES residents(id);
CREATE INDEX IF NOT EXISTS cases_resident_idx ON cases(resident_id,updated_at DESC);

DO $$
DECLARE r record;
DECLARE rid uuid;
BEGIN
  FOR r IN
    SELECT id,resident_name,phone,email,date_of_birth,address,preferred_contact,created_by,created_at,updated_at
      FROM cases
     WHERE resident_id IS NULL
  LOOP
    INSERT INTO residents(full_name,phone,email,date_of_birth,address,preferred_contact,created_by,created_at,updated_at)
    VALUES(
      COALESCE(NULLIF(trim(r.resident_name),''),'Unnamed resident'),
      NULLIF(trim(COALESCE(r.phone,'')),''),
      NULLIF(trim(COALESCE(r.email,'')),''),
      r.date_of_birth,
      NULLIF(trim(COALESCE(r.address,'')),''),
      NULLIF(trim(COALESCE(r.preferred_contact,'')),''),
      r.created_by,
      COALESCE(r.created_at,now()),
      COALESCE(r.updated_at,now())
    )
    RETURNING id INTO rid;

    UPDATE cases SET resident_id=rid WHERE id=r.id;
  END LOOP;
END $$;

DROP TRIGGER IF EXISTS trg_touch_updated_at ON residents;
CREATE TRIGGER trg_touch_updated_at
BEFORE UPDATE ON residents
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
