-- ============================================================
-- Onboarding Data Archive Table
-- When admin rejects a partner, their onboarding_data row is
-- moved here and the live row is deleted so they start fresh.
-- Run this in your Supabase SQL Editor.
-- ============================================================

-- Create archive table with identical structure to onboarding_data
CREATE TABLE IF NOT EXISTS onboarding_data_archive
  (LIKE onboarding_data INCLUDING DEFAULTS);

-- Add archive-specific columns
ALTER TABLE onboarding_data_archive
  ADD COLUMN IF NOT EXISTS archived_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS rejection_reason  TEXT;

-- Primary key (id is copied from onboarding_data — allow multiple rejection cycles)
-- We drop the default PK constraint copied by LIKE and add our own on (id, archived_at)
-- so the same user can be rejected more than once over time.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'onboarding_data_archive'::regclass
      AND contype = 'p'
  ) THEN
    ALTER TABLE onboarding_data_archive
      ADD PRIMARY KEY (id, archived_at);
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_onboarding_data_archive_auth_user_id
  ON onboarding_data_archive(auth_user_id);

CREATE INDEX IF NOT EXISTS idx_onboarding_data_archive_archived_at
  ON onboarding_data_archive(archived_at DESC);

-- RLS disabled — admin backend uses service-role key
ALTER TABLE onboarding_data_archive DISABLE ROW LEVEL SECURITY;
