-- Migration: 008_add_username_to_users
-- Adds unique customizable username handle to users table.

-- UP
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS username CITEXT;

-- Backfill existing users with a sanitized username derived from their email prefix
UPDATE users
SET username = LOWER(
  REGEXP_REPLACE(
    SPLIT_PART(email, '@', 1),
    '[^a-zA-Z0-9_]',
    '_',
    'g'
  )
)
WHERE username IS NULL;

-- Handle any potential length violations (<3 chars) by padding
UPDATE users
SET username = username || '_iq'
WHERE LENGTH(username) < 3;

-- Make username NOT NULL and add UNIQUE constraint + index
ALTER TABLE users
  ALTER COLUMN username SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS users_username_key ON users (username);

ALTER TABLE users
  ADD CONSTRAINT users_username_format_check
  CHECK (LENGTH(username) >= 3 AND LENGTH(username) <= 30 AND username ~ '^[a-zA-Z0-9_]+$');

-- DOWN
ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_username_format_check,
  DROP COLUMN IF EXISTS username;
