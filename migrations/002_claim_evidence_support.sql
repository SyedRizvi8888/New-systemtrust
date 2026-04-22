-- ═══════════════════════════════════════════════════════════════════════════
-- Migration: Enable Claim Evidence Image Storage
-- ═══════════════════════════════════════════════════════════════════════════
-- 
-- Purpose: Create the claim_evidence table to store proof images uploaded
-- during the claim process. This migration enables the admin dashboard to
-- display supporting photos for claims.
--
-- To run: Execute in Supabase SQL Editor or with:
-- psql -d your_db < migrations/002_claim_evidence_support.sql
-- ═══════════════════════════════════════════════════════════════════════════

-- Create claim_evidence table if it doesn't exist
CREATE TABLE IF NOT EXISTS claim_evidence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  claim_request_id UUID NOT NULL REFERENCES claim_requests(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  file_url TEXT,
  mime_type TEXT,
  file_size_bytes INTEGER,
  ocr_text TEXT,
  verification_score NUMERIC(5,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for fast lookups by claim
CREATE INDEX IF NOT EXISTS idx_claim_evidence_claim_id ON claim_evidence(claim_request_id);

-- Enable Row Level Security
ALTER TABLE claim_evidence ENABLE ROW LEVEL SECURITY;

-- Ensure helper function exists for policy checks
-- This fallback works even if enterprise RBAC tables/functions are not present yet.
CREATE OR REPLACE FUNCTION is_privileged_operator(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_result BOOLEAN := FALSE;
  role_result BOOLEAN := FALSE;
BEGIN
  -- If is_admin_user(uuid) exists, use it.
  IF to_regprocedure('public.is_admin_user(uuid)') IS NOT NULL THEN
    EXECUTE 'SELECT public.is_admin_user($1)' INTO admin_result USING target_user_id;
  END IF;

  IF admin_result THEN
    RETURN TRUE;
  END IF;

  -- If user_roles table exists, treat admin/district_admin as privileged.
  IF to_regclass('public.user_roles') IS NOT NULL THEN
    EXECUTE 'SELECT EXISTS (
      SELECT 1
      FROM public.user_roles ur
      WHERE ur.user_id = $1
        AND ur.role_key IN (''admin'', ''district_admin'')
    )' INTO role_result USING target_user_id;
  END IF;

  RETURN role_result;
END;
$$;

REVOKE ALL ON FUNCTION is_privileged_operator(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION is_privileged_operator(UUID) TO authenticated;

-- ────────────────────────────────────────────────────────────────────────────
-- RLS Policies
-- ────────────────────────────────────────────────────────────────────────────

-- Allow authenticated users to view evidence for their own claims
DROP POLICY IF EXISTS "Authenticated can view own claim evidence" ON claim_evidence;
CREATE POLICY "Authenticated can view own claim evidence"
  ON claim_evidence FOR SELECT
  USING (EXISTS(SELECT 1 FROM claim_requests WHERE claim_requests.id = claim_evidence.claim_request_id AND LOWER(claimant_email) = LOWER(auth.jwt() ->> 'email')));

-- Allow authenticated users to upload evidence for claims they're making
DROP POLICY IF EXISTS "Authenticated can insert claim evidence" ON claim_evidence;
CREATE POLICY "Authenticated can insert claim evidence"
  ON claim_evidence FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Allow privileged operators (admins) to manage evidence
DROP POLICY IF EXISTS "Privileged can manage claim evidence" ON claim_evidence;
CREATE POLICY "Privileged can manage claim evidence"
  ON claim_evidence FOR UPDATE
  USING (is_privileged_operator(auth.uid()));

-- Grant permissions
GRANT SELECT ON claim_evidence TO authenticated;
GRANT INSERT ON claim_evidence TO authenticated;
GRANT UPDATE ON claim_evidence TO authenticated;

-- ════════════════════════════════════════════════════════════════════════════
-- Migration Complete
-- ════════════════════════════════════════════════════════════════════════════
