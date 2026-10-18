-- Migration: 005_create_analyses
-- SF-2 (keyword match score) + SF-3 (ATS compatibility score) combined per
-- analysis run, per the AnalysisOrchestrator design in the SDD.

-- UP
CREATE TABLE analyses (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id                 UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
  job_description_id        UUID REFERENCES job_descriptions(id) ON DELETE SET NULL,
  keyword_match_score       NUMERIC(5,2),
  ats_compatibility_score   NUMERIC(5,2),
  missing_keywords          JSONB NOT NULL DEFAULT '[]'::jsonb,
  matched_keywords          JSONB NOT NULL DEFAULT '[]'::jsonb,
  issues                    JSONB NOT NULL DEFAULT '[]'::jsonb,
  status                    VARCHAR(24) NOT NULL DEFAULT 'pending'
                               CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  error_message             TEXT,
  analyzed_at                TIMESTAMPTZ,
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX analyses_resume_id_idx ON analyses (resume_id);
CREATE INDEX analyses_job_description_id_idx ON analyses (job_description_id);
CREATE INDEX analyses_resume_created_idx ON analyses (resume_id, created_at DESC);

CREATE TRIGGER trg_analyses_updated_at
  BEFORE UPDATE ON analyses
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- DOWN
DROP TABLE IF EXISTS analyses;
