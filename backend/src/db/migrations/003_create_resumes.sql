-- Migration: 003_create_resumes
-- SF-1 (Resume Upload & Parsing), SF-5 (Version Tracking).
-- parent_resume_id links a revised submission back to its lineage (FR-5.1-5.3).
-- raw_text_encrypted stores AES-256-GCM ciphertext (NFR-SE2), never plaintext.

-- UP
CREATE TABLE resumes (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_resume_id  UUID REFERENCES resumes(id) ON DELETE SET NULL,
  root_resume_id    UUID,                       -- first version in the lineage; self-referencing chain root
  version_number    INTEGER NOT NULL DEFAULT 1,
  display_name      VARCHAR(255) NOT NULL,
  file_name         VARCHAR(255) NOT NULL,
  file_type         VARCHAR(16) NOT NULL CHECK (file_type IN ('pdf', 'docx')),
  file_size_bytes   INTEGER NOT NULL,
  storage_path      VARCHAR(512) NOT NULL,
  raw_text_encrypted TEXT,                       -- NULL until parsing completes
  parsed_sections   JSONB NOT NULL DEFAULT '{}'::jsonb,
  formatting_flags  JSONB NOT NULL DEFAULT '[]'::jsonb,
  status            VARCHAR(24) NOT NULL DEFAULT 'uploaded'
                      CHECK (status IN ('uploaded', 'parsing', 'parsed', 'failed')),
  parse_error       TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX resumes_user_id_idx ON resumes (user_id);
CREATE INDEX resumes_parent_resume_id_idx ON resumes (parent_resume_id);
CREATE INDEX resumes_root_resume_id_idx ON resumes (root_resume_id);
CREATE INDEX resumes_user_root_idx ON resumes (user_id, root_resume_id);

CREATE TRIGGER trg_resumes_updated_at
  BEFORE UPDATE ON resumes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- DOWN
DROP TABLE IF EXISTS resumes;
