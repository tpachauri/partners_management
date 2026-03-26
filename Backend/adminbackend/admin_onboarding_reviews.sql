-- ============================================================
-- Admin Onboarding Reviews Table
-- Stores per-field admin annotations for each partner review:
--   admin_value, admin_comment, admin_upload_url per field,
--   plus a single final_comment per review.
-- Run this in your Supabase SQL Editor.
-- ============================================================

CREATE TABLE IF NOT EXISTS admin_onboarding_reviews (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  onboarding_id    UUID        NOT NULL REFERENCES onboarding_data(id) ON DELETE CASCADE,
  -- JSON array of per-field notes:
  -- [{ field_key: string, admin_value: string, admin_comment: string, admin_upload_url: string }]
  field_notes      JSONB       NOT NULL DEFAULT '[]'::jsonb,
  final_comment    TEXT,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by       TEXT,
  UNIQUE(onboarding_id)
);

CREATE INDEX IF NOT EXISTS idx_admin_onboarding_reviews_onboarding_id
  ON admin_onboarding_reviews(onboarding_id);

-- RLS disabled — admin backend uses service-role key
ALTER TABLE admin_onboarding_reviews DISABLE ROW LEVEL SECURITY;
