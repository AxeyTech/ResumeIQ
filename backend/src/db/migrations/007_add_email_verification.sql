-- Migration: 007_add_email_verification
-- Adds email verification support: OTP code, verified flag, and expiry.

-- UP
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email_verified     BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS verification_code  VARCHAR(6),
  ADD COLUMN IF NOT EXISTS verification_expires_at TIMESTAMPTZ;

-- Google OAuth users are always verified (Google already verified their email)
UPDATE users SET email_verified = TRUE WHERE google_id IS NOT NULL;

-- DOWN
ALTER TABLE users
  DROP COLUMN IF EXISTS verification_expires_at,
  DROP COLUMN IF EXISTS verification_code,
  DROP COLUMN IF EXISTS email_verified;
