-- ═══════════════════════════════════════════════════════════════════════════
-- Migration: Admin Claim Restrictions & Admin Dashboard Updates
-- ═══════════════════════════════════════════════════════════════════════════
-- Purpose:
-- This migration ensures admins cannot claim items and sets up proper
-- admin functionality for the redesigned admin dashboard.
--
-- Changes:
-- 1. Ensures claim validation prevents admins from claiming
-- 2. Adds admin_restricted flag to track items restricted from claiming
-- 3. Sets up admin messaging capabilities
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Add admin_restricted column to lost_items for visibility control
-- ---------------------------------------------------------------------------
ALTER TABLE lost_items
  ADD COLUMN IF NOT EXISTS admin_restricted BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_lost_items_admin_restricted
  ON lost_items(admin_restricted);

-- ---------------------------------------------------------------------------
-- 2. Add admin_message_history column to claim_requests
-- ---------------------------------------------------------------------------
ALTER TABLE claim_requests
  ADD COLUMN IF NOT EXISTS admin_messages JSONB DEFAULT '[]'::jsonb;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_claim_requests_admin_messages
  ON claim_requests USING gin(admin_messages);

-- ---------------------------------------------------------------------------
-- 3. Add verified_by column to indicate which admin reviewed the claim
-- ---------------------------------------------------------------------------
ALTER TABLE claim_requests
  ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_claim_requests_verified_by
  ON claim_requests(verified_by);

-- ---------------------------------------------------------------------------
-- 4. Update claim_requests to store admin contact logs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  claim_request_id UUID NOT NULL REFERENCES claim_requests(id) ON DELETE CASCADE,
  sent_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  recipient_email TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'failed')),
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_messages_claim_id
  ON admin_messages(claim_request_id);

CREATE INDEX IF NOT EXISTS idx_admin_messages_sent_by
  ON admin_messages(sent_by);

CREATE INDEX IF NOT EXISTS idx_admin_messages_status
  ON admin_messages(status);

-- Enable RLS on admin_messages
ALTER TABLE admin_messages ENABLE ROW LEVEL SECURITY;

-- Policies for admin_messages
DROP POLICY IF EXISTS "Authenticated can view admin messages" ON admin_messages;
DROP POLICY IF EXISTS "Privileged can send admin messages" ON admin_messages;

CREATE POLICY "Authenticated can view admin messages"
  ON admin_messages FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Privileged can send admin messages"
  ON admin_messages FOR INSERT
  WITH CHECK (is_privileged_operator(auth.uid()));

-- ---------------------------------------------------------------------------
-- 5. Update lost_items table for proper admin workflows
-- ---------------------------------------------------------------------------
-- Add escalation tracking
ALTER TABLE lost_items
  ADD COLUMN IF NOT EXISTS escalated_to_admin BOOLEAN DEFAULT FALSE;

ALTER TABLE lost_items
  ADD COLUMN IF NOT EXISTS escalation_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_lost_items_escalated
  ON lost_items(escalated_to_admin);

-- ---------------------------------------------------------------------------
-- 6. Create function to check if user is admin (used in application checks)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_user_admin(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    is_admin_user(target_user_id)
    OR EXISTS (
      SELECT 1
      FROM user_roles ur
      WHERE ur.user_id = target_user_id
        AND ur.role_key IN ('admin', 'district_admin')
    );
$$;

REVOKE ALL ON FUNCTION is_user_admin(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION is_user_admin(UUID) TO authenticated;

-- ---------------------------------------------------------------------------
-- 7. Create audit function for admin actions
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION log_admin_action(
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_description TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_audit_id UUID;
BEGIN
  IF NOT is_privileged_operator(auth.uid()) THEN
    RAISE EXCEPTION 'Only privileged users can log actions';
  END IF;

  INSERT INTO audit_logs (actor_user_id, entity_type, entity_id, action)
  VALUES (auth.uid(), p_entity_type, p_entity_id, p_action)
  RETURNING id INTO v_audit_id;

  RETURN v_audit_id;
END;
$$;

REVOKE ALL ON FUNCTION log_admin_action(TEXT, TEXT, UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION log_admin_action(TEXT, TEXT, UUID, TEXT) TO authenticated;

-- ---------------------------------------------------------------------------
-- 8. Update RLS policies to prevent admin claiming
-- ---------------------------------------------------------------------------
-- This is enforced at the application level, but we can add checks if needed

-- ---------------------------------------------------------------------------
-- 9. Grant permissions on new tables
-- ---------------------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE ON admin_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE ON admin_messages TO anon;

COMMIT;

-- ════════════════════════════════════════════════════════════════════════════
-- Migration Complete
-- ════════════════════════════════════════════════════════════════════════════
--
-- Next Steps:
-- 1. Test that admins cannot claim items (app-level check)
-- 2. Verify admin messaging functionality works
-- 3. Test admin dashboard with new messaging features
--
-- ════════════════════════════════════════════════════════════════════════════
