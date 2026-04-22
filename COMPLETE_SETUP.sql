-- ═══════════════════════════════════════════════════════════════════════════
-- COMPLETE LOST & FOUND SYSTEM - FULL SQL SETUP
-- ═══════════════════════════════════════════════════════════════════════════
-- Run this ENTIRE file in Supabase SQL Editor
-- This creates everything: items, claims, cases, events, approval workflow
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. LOST ITEMS TABLE
-- ═══════════════════════════════════════════════════════════════════════════

DROP TABLE IF EXISTS lost_items CASCADE;
CREATE TABLE lost_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'electronics', 'clothing', 'accessories', 'books', 'sports',
    'keys', 'wallet', 'jewelry', 'bag', 'other'
  )),
  location TEXT NOT NULL,
  date_found DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'found' CHECK (status IN (
    'found', 'lost', 'under_review', 'matched', 'returned', 'archived'
  )),
  image_url TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  student_id TEXT,
  student_name TEXT,
  grade TEXT,
  preferred_contact_method TEXT,
  claimed_by TEXT,
  claimed_at TIMESTAMPTZ,
  admin_notes TEXT,
  approval_status TEXT DEFAULT 'approved' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX idx_lost_items_status ON lost_items(status);
CREATE INDEX idx_lost_items_category ON lost_items(category);
CREATE INDEX idx_lost_items_approval_status ON lost_items(approval_status);
CREATE INDEX idx_lost_items_created_by ON lost_items(created_by);
CREATE INDEX idx_lost_items_date_found ON lost_items(date_found DESC);
CREATE INDEX idx_lost_items_created_at ON lost_items(created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. CLAIM REQUESTS TABLE
-- ═══════════════════════════════════════════════════════════════════════════

DROP TABLE IF EXISTS claim_requests CASCADE;
CREATE TABLE claim_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID NOT NULL REFERENCES lost_items(id) ON DELETE CASCADE,
  claimant_name TEXT NOT NULL,
  claimant_email TEXT NOT NULL,
  claimant_phone TEXT,
  claimant_student_id TEXT,
  proof_description TEXT NOT NULL,
  preferred_contact_method TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'needs_info', 'approved', 'rejected', 'pickup_scheduled', 'closed'
  )),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  internal_notes TEXT
);

CREATE INDEX idx_claim_requests_item_id ON claim_requests(item_id);
CREATE INDEX idx_claim_requests_status ON claim_requests(status);
CREATE INDEX idx_claim_requests_submitted_at ON claim_requests(submitted_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. CLAIM CASES TABLE
-- ═══════════════════════════════════════════════════════════════════════════

DROP TABLE IF EXISTS claim_cases CASCADE;
CREATE TABLE claim_cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  claim_request_id UUID NOT NULL UNIQUE REFERENCES claim_requests(id) ON DELETE CASCADE,
  state TEXT NOT NULL DEFAULT 'open' CHECK (state IN (
    'open', 'verification', 'approved', 'rejected', 'pickup_scheduled', 'closed'
  )),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN (
    'low', 'normal', 'high', 'urgent'
  )),
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sla_due_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_claim_cases_state ON claim_cases(state);
CREATE INDEX idx_claim_cases_priority ON claim_cases(priority);
CREATE INDEX idx_claim_cases_assigned_to ON claim_cases(assigned_to);

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. CLAIM CASE EVENTS TABLE
-- ═══════════════════════════════════════════════════════════════════════════

DROP TABLE IF EXISTS claim_case_events CASCADE;
CREATE TABLE claim_case_events (
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

CREATE INDEX idx_claim_case_events_case_id ON claim_case_events(claim_case_id);
CREATE INDEX idx_claim_case_events_type ON claim_case_events(event_type);
CREATE INDEX idx_claim_case_events_created_at ON claim_case_events(created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. CLAIM EVIDENCE TABLE
-- ═══════════════════════════════════════════════════════════════════════════

DROP TABLE IF EXISTS claim_evidence CASCADE;
CREATE TABLE claim_evidence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  claim_id UUID NOT NULL REFERENCES claim_requests(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT,
  file_type TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_claim_evidence_claim_id ON claim_evidence(claim_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- 6. ADMIN USERS TABLE
-- ═══════════════════════════════════════════════════════════════════════════

DROP TABLE IF EXISTS admin_users CASCADE;
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX idx_admin_users_user_id ON admin_users(user_id);
CREATE INDEX idx_admin_users_email ON admin_users(email);

-- ═══════════════════════════════════════════════════════════════════════════
-- 7. ADMIN ACTION LOG TABLE
-- ═══════════════════════════════════════════════════════════════════════════

DROP TABLE IF EXISTS admin_action_logs CASCADE;
CREATE TABLE admin_action_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_admin_action_logs_admin_id ON admin_action_logs(admin_id);
CREATE INDEX idx_admin_action_logs_created_at ON admin_action_logs(created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════
-- 8. PROFILES TABLE (for admin status)
-- ═══════════════════════════════════════════════════════════════════════════

DROP TABLE IF EXISTS profiles CASCADE;
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- 9. TRIGGERS FOR AUTO-UPDATE TIMESTAMPS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_lost_items_updated_at ON lost_items;
CREATE TRIGGER update_lost_items_updated_at
  BEFORE UPDATE ON lost_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_claim_cases_updated_at ON claim_cases;
CREATE TRIGGER update_claim_cases_updated_at
  BEFORE UPDATE ON claim_cases
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════════
-- 10. ROW LEVEL SECURITY (RLS)
-- ═══════════════════════════════════════════════════════════════════════════

-- Enable RLS
ALTER TABLE lost_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_case_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_action_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- --- LOST ITEMS POLICIES ---

DROP POLICY IF EXISTS "View approved items or own items" ON lost_items;
CREATE POLICY "View approved items or own items"
  ON lost_items FOR SELECT
  USING (
    approval_status = 'approved'
    OR created_by = auth.uid()
    OR (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
  );

DROP POLICY IF EXISTS "Authenticated users can insert items" ON lost_items;
CREATE POLICY "Authenticated users can insert items"
  ON lost_items FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Item creators can update own items" ON lost_items;
CREATE POLICY "Item creators can update own items"
  ON lost_items FOR UPDATE
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "Admins can update items" ON lost_items;
CREATE POLICY "Admins can update items"
  ON lost_items FOR UPDATE
  USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true)
  WITH CHECK ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true);

DROP POLICY IF EXISTS "Admins can delete items" ON lost_items;
CREATE POLICY "Admins can delete items"
  ON lost_items FOR DELETE
  USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true);

-- --- CLAIM REQUESTS POLICIES ---

DROP POLICY IF EXISTS "Anyone can view claim requests" ON claim_requests;
CREATE POLICY "Anyone can view claim requests"
  ON claim_requests FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Anyone can create claim requests" ON claim_requests;
CREATE POLICY "Anyone can create claim requests"
  ON claim_requests FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can update claim requests" ON claim_requests;
CREATE POLICY "Admins can update claim requests"
  ON claim_requests FOR UPDATE
  USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true)
  WITH CHECK ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true);

-- --- CLAIM CASES POLICIES ---

DROP POLICY IF EXISTS "Admins can view claim cases" ON claim_cases;
CREATE POLICY "Admins can view claim cases"
  ON claim_cases FOR SELECT
  USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true);

DROP POLICY IF EXISTS "Admins can create claim cases" ON claim_cases;
CREATE POLICY "Admins can create claim cases"
  ON claim_cases FOR INSERT
  WITH CHECK ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true);

DROP POLICY IF EXISTS "Admins can update claim cases" ON claim_cases;
CREATE POLICY "Admins can update claim cases"
  ON claim_cases FOR UPDATE
  USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true)
  WITH CHECK ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true);

-- --- CLAIM CASE EVENTS POLICIES ---

DROP POLICY IF EXISTS "Admins can view case events" ON claim_case_events;
CREATE POLICY "Admins can view case events"
  ON claim_case_events FOR SELECT
  USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true);

DROP POLICY IF EXISTS "Admins can create case events" ON claim_case_events;
CREATE POLICY "Admins can create case events"
  ON claim_case_events FOR INSERT
  WITH CHECK ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true);

-- --- CLAIM EVIDENCE POLICIES ---

DROP POLICY IF EXISTS "Anyone can view claim evidence" ON claim_evidence;
CREATE POLICY "Anyone can view claim evidence"
  ON claim_evidence FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Anyone can upload claim evidence" ON claim_evidence;
CREATE POLICY "Anyone can upload claim evidence"
  ON claim_evidence FOR INSERT
  WITH CHECK (true);

-- --- ADMIN USERS POLICIES ---

DROP POLICY IF EXISTS "Admins can view admin users" ON admin_users;
CREATE POLICY "Admins can view admin users"
  ON admin_users FOR SELECT
  USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true);

DROP POLICY IF EXISTS "Admins can manage admin users" ON admin_users;
CREATE POLICY "Admins can manage admin users"
  ON admin_users FOR ALL
  USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true)
  WITH CHECK ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true);

-- --- ADMIN ACTION LOGS POLICIES ---

DROP POLICY IF EXISTS "Admins can view action logs" ON admin_action_logs;
CREATE POLICY "Admins can view action logs"
  ON admin_action_logs FOR SELECT
  USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true);

DROP POLICY IF EXISTS "Admins can create action logs" ON admin_action_logs;
CREATE POLICY "Admins can create action logs"
  ON admin_action_logs FOR INSERT
  WITH CHECK ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true);

-- --- PROFILES POLICIES ---

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id OR (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ═══════════════════════════════════════════════════════════════════════════
-- 11. HELPER FUNCTIONS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT is_admin FROM profiles WHERE id = user_id) = true;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION log_admin_action(
  p_action TEXT,
  p_table_name TEXT DEFAULT NULL,
  p_record_id UUID DEFAULT NULL,
  p_details TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO admin_action_logs (admin_id, action, table_name, record_id, details)
  VALUES (auth.uid(), p_action, p_table_name, p_record_id, p_details);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION approve_item(
  p_item_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can approve items';
  END IF;

  UPDATE lost_items
  SET
    approval_status = 'approved',
    approved_by = auth.uid(),
    approved_at = NOW()
  WHERE id = p_item_id;

  PERFORM log_admin_action('item_approved', 'lost_items', p_item_id, p_notes);

  v_result := jsonb_build_object(
    'success', true,
    'item_id', p_item_id,
    'action', 'approved',
    'approved_at', NOW()
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION reject_item(
  p_item_id UUID,
  p_reason TEXT
)
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can reject items';
  END IF;

  UPDATE lost_items
  SET
    approval_status = 'rejected',
    approved_by = auth.uid(),
    approved_at = NOW(),
    rejection_reason = p_reason
  WHERE id = p_item_id;

  PERFORM log_admin_action('item_rejected', 'lost_items', p_item_id, p_reason);

  v_result := jsonb_build_object(
    'success', true,
    'item_id', p_item_id,
    'action', 'rejected',
    'reason', p_reason
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════════════════
-- 12. AUTO-CREATE PROFILE ON USER SIGNUP
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, is_admin)
  VALUES (new.id, false);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ═══════════════════════════════════════════════════════════════════════════
-- 13. GRANT PERMISSIONS
-- ═══════════════════════════════════════════════════════════════════════════

GRANT EXECUTE ON FUNCTION is_admin(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION log_admin_action(TEXT, TEXT, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION approve_item(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_item(UUID, TEXT) TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- 14. SET ALL EXISTING ITEMS TO APPROVED (BACKWARDS COMPATIBLE)
-- ═══════════════════════════════════════════════════════════════════════════

UPDATE lost_items
SET approval_status = 'approved', approved_at = NOW()
WHERE approval_status IS NULL OR approval_status = 'pending';

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════════
-- DONE! Everything is set up
-- ═══════════════════════════════════════════════════════════════════════════
-- Tables created:
--   ✅ lost_items (with approval workflow)
--   ✅ claim_requests
--   ✅ claim_cases
--   ✅ claim_case_events
--   ✅ claim_evidence
--   ✅ admin_users
--   ✅ admin_action_logs
--   ✅ profiles
--
-- Features:
--   ✅ Admin approval for items
--   ✅ Claim case tracking
--   ✅ Evidence uploads
--   ✅ Admin action logging
--   ✅ RLS security policies
--   ✅ Auto-timestamp updates
--   ✅ Helper functions
-- ═══════════════════════════════════════════════════════════════════════════
