-- Migration: 010_create_resume_defenses
-- Stores Reverse Interview Defense Matrix and Google XYZ Formula bullet evaluations

-- UP
CREATE TABLE IF NOT EXISTS resume_defenses (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id                   UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
  user_id                     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  overall_defensibility_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  xyz_compliance_rate         NUMERIC(5,2) NOT NULL DEFAULT 0,
  risk_distribution           JSONB NOT NULL DEFAULT '{"high": 0, "medium": 0, "low": 0, "totalBullets": 0}'::jsonb,
  key_strengths               JSONB NOT NULL DEFAULT '[]'::jsonb,
  top_vulnerabilities         JSONB NOT NULL DEFAULT '[]'::jsonb,
  bullets                     JSONB NOT NULL DEFAULT '[]'::jsonb,
  analyzed_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS resume_defenses_resume_id_idx ON resume_defenses (resume_id);
CREATE INDEX IF NOT EXISTS resume_defenses_user_id_idx ON resume_defenses (user_id);
CREATE INDEX IF NOT EXISTS resume_defenses_resume_user_idx ON resume_defenses (resume_id, user_id);

DROP TRIGGER IF EXISTS trg_resume_defenses_updated_at ON resume_defenses;
CREATE TRIGGER trg_resume_defenses_updated_at
  BEFORE UPDATE ON resume_defenses
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- DOWN
DROP TABLE IF EXISTS resume_defenses;
