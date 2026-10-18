-- Migration: 004_create_job_descriptions
-- SF-2. BR-2: only one active job description per resume version.

-- UP
CREATE TABLE job_descriptions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id           UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
  raw_text            TEXT NOT NULL,
  extracted_keywords  JSONB NOT NULL DEFAULT '[]'::jsonb,
  source              VARCHAR(16) NOT NULL DEFAULT 'user_provided'
                        CHECK (source IN ('user_provided', 'benchmark')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- BR-2: enforce a single active JD per resume version.
CREATE UNIQUE INDEX job_descriptions_resume_id_key ON job_descriptions (resume_id);

CREATE TRIGGER trg_job_descriptions_updated_at
  BEFORE UPDATE ON job_descriptions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- DOWN
DROP TABLE IF EXISTS job_descriptions;
