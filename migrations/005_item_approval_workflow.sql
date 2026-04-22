-- ═══════════════════════════════════════════════════════════════════════════
-- Migration: Item Approval Workflow
-- ═══════════════════════════════════════════════════════════════════════════
-- Purpose: Add admin approval requirement for student submissions
--
-- Flow: Student submits → approval_status='pending' → NOT visible publicly
--                      ↓ (admin reviews)
--                      → approval_status='approved' → NOW visible
--                      OR approval_status='rejected' → Item removed
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Add approval tracking columns
-- ---------------------------------------------------------------------------
ALTER TABLE lost_items
  ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Add constraint
ALTER TABLE lost_items DROP CONSTRAINT IF EXISTS lost_items_approval_status_check;
ALTER TABLE lost_items ADD CONSTRAINT lost_items_approval_status_check
  CHECK (approval_status IN ('pending', 'approved', 'rejected'));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_lost_items_approval_status
  ON lost_items(approval_status);

CREATE INDEX IF NOT EXISTS idx_lost_items_created_by
  ON lost_items(created_by);

-- ---------------------------------------------------------------------------
-- 2. Update RLS policies to filter by approval status
-- ---------------------------------------------------------------------------
-- Enable RLS if not already
ALTER TABLE lost_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view lost items" ON lost_items;
DROP POLICY IF EXISTS "Authenticated users can view lost items" ON lost_items;
DROP POLICY IF EXISTS "Users can view approved items and own items" ON lost_items;

-- New SELECT policy: See approved items OR own items OR if admin
CREATE POLICY "View approved items or own items"
  ON lost_items FOR SELECT
  USING (
    approval_status = 'approved'
    OR created_by = auth.uid()
    OR (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
  );

-- Allow authenticated users to insert
DROP POLICY IF EXISTS "Anyone can create lost items" ON lost_items;
DROP POLICY IF EXISTS "Authenticated users can create lost items" ON lost_items;

CREATE POLICY "Authenticated users can insert items"
  ON lost_items FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Allow item creators to update (except approval fields)
DROP POLICY IF EXISTS "Authenticated users can update lost items" ON lost_items;
DROP POLICY IF EXISTS "Item creators and admins can update items" ON lost_items;

CREATE POLICY "Item creators can update own items"
  ON lost_items FOR UPDATE
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Allow admins to update anything
CREATE POLICY "Admins can update items"
  ON lost_items FOR UPDATE
  USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true)
  WITH CHECK ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true);

-- Allow admins to delete
DROP POLICY IF EXISTS "Authenticated users can delete lost items" ON lost_items;
DROP POLICY IF EXISTS "Admins can delete items" ON lost_items;

CREATE POLICY "Admins can delete items"
  ON lost_items FOR DELETE
  USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true);

-- ---------------------------------------------------------------------------
-- 3. Set all existing items to approved (no breaking change)
-- ---------------------------------------------------------------------------
UPDATE lost_items
SET approval_status = 'approved', approved_at = NOW()
WHERE approval_status IS NULL OR approval_status = 'pending';

COMMIT;

-- ════════════════════════════════════════════════════════════════════════════
-- Migration Summary:
-- ════════════════════════════════════════════════════════════════════════════
-- NEW COLUMNS:
--   - approval_status: 'pending' | 'approved' | 'rejected'
--   - approved_by: admin user ID
--   - approved_at: when approved/rejected
--   - rejection_reason: why it was rejected
--
-- VISIBILITY:
--   - 'pending' items: only visible to reporter & admins
--   - 'approved' items: visible to everyone
--   - 'rejected' items: only visible to reporter & admins
--
-- To approve/reject in code: Update approval_status + fire events
-- ════════════════════════════════════════════════════════════════════════════
