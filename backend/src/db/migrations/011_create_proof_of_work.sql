-- Migration: 011_create_proof_of_work
-- Stores GitHub Proof-of-Work Codebase Verifications and Verified Skill Credentials

-- UP
CREATE TABLE IF NOT EXISTS proof_of_work_verifications (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id                   UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
  user_id                     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  repo_url                    VARCHAR(500) NOT NULL,
  verification_code           VARCHAR(64) NOT NULL,
  overall_pow_score           NUMERIC(5,2) NOT NULL DEFAULT 0,
  verification_level          VARCHAR(32) NOT NULL DEFAULT 'BRONZE_STANDARD',
  verified_skills             JSONB NOT NULL DEFAULT '[]'::jsonb,
  architecture_signals        JSONB NOT NULL DEFAULT '[]'::jsonb,
  claim_mappings              JSONB NOT NULL DEFAULT '[]'::jsonb,
  embed_markdown              TEXT,
  embed_html                  TEXT,
  verified_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pow_resume_id_idx ON proof_of_work_verifications (resume_id);
CREATE INDEX IF NOT EXISTS pow_user_id_idx ON proof_of_work_verifications (user_id);
CREATE INDEX IF NOT EXISTS pow_code_idx ON proof_of_work_verifications (verification_code);

DROP TRIGGER IF EXISTS trg_pow_updated_at ON proof_of_work_verifications;
CREATE TRIGGER trg_pow_updated_at
  BEFORE UPDATE ON proof_of_work_verifications
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- DOWN
DROP TABLE IF EXISTS proof_of_work_verifications;
