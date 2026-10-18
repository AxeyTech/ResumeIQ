-- Migration: 007_add_email_verification
-- Adds email verification support: OTP code, verified flag, and expiry.

-- UP
ALTER TABLE users
  ADD COLUMN email_verified     BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN verification_code  VARCHAR(6),
  ADD COLUMN verification_expires_at TIMESTAMPTZ;

-- Google OAuth users are always verified (Google already verified their email)
UPDATE users SET email_verified = TRUE WHERE google_id IS NOT NULL;

-- DOWN
ALTER TABLE users
  DROP COLUMN IF EXISTS verification_expires_at,
  DROP COLUMN IF EXISTS verification_code,
  DROP COLUMN IF EXISTS email_verified;
