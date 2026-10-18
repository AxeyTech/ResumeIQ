-- Migration: 006_create_reports
-- SF-4. Rendered on demand to PDF (FR-4.4); recommendations stored as JSON,
-- not a stored binary blob (per SDD Section 2.4 table notes).

-- UP
CREATE TABLE reports (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id       UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  summary           TEXT NOT NULL DEFAULT '',
  recommendations   JSONB NOT NULL DEFAULT '[]'::jsonb,
  generated_by      VARCHAR(16) NOT NULL DEFAULT 'gemini'
                       CHECK (generated_by IN ('gemini', 'rule_based')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX reports_analysis_id_key ON reports (analysis_id);

CREATE TRIGGER trg_reports_updated_at
  BEFORE UPDATE ON reports
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- DOWN
DROP TABLE IF EXISTS reports;
