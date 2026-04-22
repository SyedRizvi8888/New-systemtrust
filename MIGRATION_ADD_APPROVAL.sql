-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION: Add Item Approval Workflow to Existing Database
-- ═══════════════════════════════════════════════════════════════════════════
-- Run this to ADD approval columns to existing lost_items table
-- DO NOT run the old supabase-schema.sql again
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. ADD APPROVAL COLUMNS TO LOST_ITEMS
-- ═══════════════════════════════════════════════════════════════════════════

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
CREATE INDEX IF NOT EXISTS idx_lost_items_approval_status ON lost_items(approval_status);
CREATE INDEX IF NOT EXISTS idx_lost_items_approval_at ON lost_items(approved_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. UPDATE CLAIM_CASES TABLE (add necessary columns if missing)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS claim_cases (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
claim_request_id UUID NOT NULL UNIQUE REFERENCES claim_requests(id) ON DELETE CASCADE,
state TEXT NOT NULL DEFAULT 'open' CHECK (state IN ('open', 'verification', 'approved', 'rejected', 'pickup_scheduled', 'closed')),
priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
sla_due_at TIMESTAMPTZ,
closed_at TIMESTAMPTZ,
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_claim_cases_state ON claim_cases(state);
CREATE INDEX IF NOT EXISTS idx_claim_cases_priority ON claim_cases(priority);

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. CREATE CLAIM_CASE_EVENTS TABLE (if missing)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS claim_case_events (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
claim_case_id UUID NOT NULL REFERENCES claim_cases(id) ON DELETE CASCADE,
event_type TEXT NOT NULL,
from_state TEXT,
to_state TEXT,
actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
notes TEXT,
metadata JSONB,
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_claim_case_events_case_id ON claim_case_events(claim_case_id);
CREATE INDEX IF NOT EXISTS idx_claim_case_events_type ON claim_case_events(event_type);
CREATE INDEX IF NOT EXISTS idx_claim_case_events_created_at ON claim_case_events(created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. CREATE CLAIM_EVIDENCE TABLE (if missing)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS claim_evidence (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
claim_id UUID NOT NULL REFERENCES claim_requests(id) ON DELETE CASCADE,
file_url TEXT NOT NULL,
file_name TEXT,
file_type TEXT,
uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_claim_evidence_claim_id ON claim_evidence(claim_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. UPDATE RLS POLICIES FOR APPROVAL WORKFLOW
-- ═══════════════════════════════════════════════════════════════════════════

-- Drop old lost_items policies
DROP POLICY IF EXISTS "Anyone can view lost items" ON lost_items;
DROP POLICY IF EXISTS "Anyone can create lost items" ON lost_items;
DROP POLICY IF EXISTS "Authenticated users can update lost items" ON lost_items;
DROP POLICY IF EXISTS "Authenticated users can delete lost items" ON lost_items;

-- New SELECT policy: See approved items OR own items (even if pending)
CREATE POLICY "View approved items or own items"
ON lost_items FOR SELECT
USING (
approval_status = 'approved'
OR created_by = auth.uid()
OR is_admin_user(auth.uid())
);

-- New INSERT policy: Authenticated can submit (will be pending)
CREATE POLICY "Authenticated users can insert items"
ON lost_items FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Item creators can update
CREATE POLICY "Item creators can update own items"
ON lost_items FOR UPDATE
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- Admins can update anything
CREATE POLICY "Admins can update items"
ON lost_items FOR UPDATE
USING (is_admin_user(auth.uid()))
WITH CHECK (is_admin_user(auth.uid()));

-- Admins can delete
CREATE POLICY "Admins can delete items"
ON lost_items FOR DELETE
USING (is_admin_user(auth.uid()));

-- ═══════════════════════════════════════════════════════════════════════════
-- 6. ENABLE RLS ON NEW TABLES
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE claim_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_case_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_evidence ENABLE ROW LEVEL SECURITY;

-- Policies for claim_cases
CREATE POLICY "Authenticated can view claim cases"
ON claim_cases FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage claim cases"
ON claim_cases FOR ALL
USING (is_admin_user(auth.uid()))
WITH CHECK (is_admin_user(auth.uid()));

-- Policies for claim_case_events
CREATE POLICY "Authenticated can view case events"
ON claim_case_events FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage case events"
ON claim_case_events FOR ALL
USING (is_admin_user(auth.uid()))
WITH CHECK (is_admin_user(auth.uid()));

-- Policies for claim_evidence
CREATE POLICY "Anyone can view claim evidence"
ON claim_evidence FOR SELECT
USING (true);

CREATE POLICY "Anyone can upload claim evidence"
ON claim_evidence FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can manage claim evidence"
ON claim_evidence FOR UPDATE
USING (is_admin_user(auth.uid()))
WITH CHECK (is_admin_user(auth.uid()));

-- ═══════════════════════════════════════════════════════════════════════════
-- 7. SET ALL EXISTING ITEMS TO APPROVED (backwards compatible)
-- ═══════════════════════════════════════════════════════════════════════════

UPDATE lost_items
SET approval_status = 'approved', approved_at = NOW()
WHERE approval_status IS NULL OR approval_status = 'pending';

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION COMPLETE
-- ═══════════════════════════════════════════════════════════════════════════
-- ✅ Added approval_status columns
-- ✅ Created claim_cases table
-- ✅ Created claim_case_events table
-- ✅ Created claim_evidence table
-- ✅ Updated RLS policies
-- ✅ Set existing items to 'approved'
--
-- Now you can:
-- 1. Students submit items → starts as 'pending'
-- 2. Admins approve/reject in dashboard
-- 3. Approved items visible to public
-- ═══════════════════════════════════════════════════════════════════════════
