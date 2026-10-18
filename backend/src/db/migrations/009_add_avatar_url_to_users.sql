-- Migration: 009_add_avatar_url_to_users
-- Adds avatar_url column to users table for profile pictures and custom DPs.

-- UP
ALTER TABLE users
  ADD COLUMN avatar_url TEXT;

-- DOWN
ALTER TABLE users
  DROP COLUMN IF EXISTS avatar_url;
