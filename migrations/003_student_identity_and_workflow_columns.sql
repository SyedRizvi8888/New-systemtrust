-- ═══════════════════════════════════════════════════════════════════════════
-- Migration: Student Identity Fields + Workflow Status Expansion
-- ═══════════════════════════════════════════════════════════════════════════
-- Purpose:
-- 1) Add missing columns used by current app payloads (grade, student_id, etc.)
-- 2) Expand status constraints to match current workflow enums
--
-- Run in Supabase SQL Editor once for your project.

BEGIN;

-- ---------------------------------------------------------------------------
-- lost_items: add new student/contact/admin fields
-- ---------------------------------------------------------------------------
ALTER TABLE lost_items
  ADD COLUMN IF NOT EXISTS contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS student_id TEXT,
  ADD COLUMN IF NOT EXISTS student_name TEXT,
  ADD COLUMN IF NOT EXISTS grade TEXT,
  ADD COLUMN IF NOT EXISTS preferred_contact_method TEXT,
  ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Replace old status constraint with workflow-compatible statuses
ALTER TABLE lost_items
  DROP CONSTRAINT IF EXISTS lost_items_status_check;

ALTER TABLE lost_items
  ADD CONSTRAINT lost_items_status_check
  CHECK (status IN ('found', 'lost', 'under_review', 'matched', 'returned', 'archived'));

-- ---------------------------------------------------------------------------
-- claim_requests: add workflow + identity fields
-- ---------------------------------------------------------------------------
ALTER TABLE claim_requests
  ADD COLUMN IF NOT EXISTS claimant_student_id TEXT,
  ADD COLUMN IF NOT EXISTS preferred_contact_method TEXT,
  ADD COLUMN IF NOT EXISTS internal_notes TEXT;

ALTER TABLE claim_requests
  DROP CONSTRAINT IF EXISTS claim_requests_status_check;

ALTER TABLE claim_requests
  ADD CONSTRAINT claim_requests_status_check
  CHECK (status IN ('pending', 'needs_info', 'approved', 'rejected', 'pickup_scheduled', 'closed'));

COMMIT;
