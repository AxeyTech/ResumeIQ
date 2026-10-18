-- Migration: 001_extensions_and_helpers
-- Sets up UUID generation and a reusable "touch updated_at" trigger function
-- used by every table below.

-- UP
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- DOWN
DROP FUNCTION IF EXISTS set_updated_at();
DROP EXTENSION IF EXISTS "pgcrypto";
