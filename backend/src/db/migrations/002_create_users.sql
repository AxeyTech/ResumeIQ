-- Migration: 002_create_users
-- FR-6.1: email/password or third-party identity provider registration.
-- NFR-SE3: passwords stored as salted one-way hashes only.

-- UP
CREATE EXTENSION IF NOT EXISTS "citext";

CREATE TABLE users (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email             CITEXT NOT NULL,
  password_hash     VARCHAR(255),              -- NULL for Google-only accounts
  google_id         VARCHAR(255),               -- NULL for password-only accounts
  name              VARCHAR(255) NOT NULL DEFAULT '',
  role              VARCHAR(32) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  monthly_analysis_count INTEGER NOT NULL DEFAULT 0,   -- BR-1: free-tier usage tracking
  monthly_count_reset_at TIMESTAMPTZ NOT NULL DEFAULT date_trunc('month', now()),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT users_has_credential CHECK (password_hash IS NOT NULL OR google_id IS NOT NULL)
);

CREATE UNIQUE INDEX users_email_key ON users (email);
CREATE UNIQUE INDEX users_google_id_key ON users (google_id) WHERE google_id IS NOT NULL;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- DOWN
DROP TABLE IF EXISTS users;
