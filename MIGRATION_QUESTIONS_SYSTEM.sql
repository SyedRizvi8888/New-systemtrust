-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION: Item Questions System
-- Creates table for Q&A on items
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. CREATE item_questions TABLE
-- ═══════════════════════════════════════════════════════════════════════════

DROP TABLE IF EXISTS item_questions CASCADE;

CREATE TABLE item_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID NOT NULL REFERENCES lost_items(id) ON DELETE CASCADE,
  asked_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  asked_by_name TEXT NOT NULL,
  asked_by_email TEXT NOT NULL,
  question_text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unanswered' CHECK (status IN ('unanswered', 'answered')),
  reply_text TEXT,
  replied_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  replied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_item_questions_item_id ON item_questions(item_id);
CREATE INDEX idx_item_questions_status ON item_questions(status);
CREATE INDEX idx_item_questions_created_at ON item_questions(created_at DESC);
CREATE INDEX idx_item_questions_asked_by ON item_questions(asked_by_user_id);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_item_questions_updated_at ON item_questions;
CREATE TRIGGER update_item_questions_updated_at
  BEFORE UPDATE ON item_questions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. ENABLE RLS
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE item_questions ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. RLS POLICIES
-- ═══════════════════════════════════════════════════════════════════════════

-- Anyone can view questions on items
DROP POLICY IF EXISTS "Anyone can view item questions" ON item_questions;
CREATE POLICY "Anyone can view item questions"
  ON item_questions FOR SELECT
  USING (true);

-- Authenticated users can ask questions
DROP POLICY IF EXISTS "Authenticated can ask questions" ON item_questions;
CREATE POLICY "Authenticated can ask questions"
  ON item_questions FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Item creator or admin can reply to questions
DROP POLICY IF EXISTS "Item creator or admin can reply to questions" ON item_questions;
CREATE POLICY "Item creator or admin can reply to questions"
  ON item_questions FOR UPDATE
  USING (
    (SELECT created_by FROM lost_items WHERE id = item_id) = auth.uid()
    OR is_admin_user(auth.uid())
  )
  WITH CHECK (
    (SELECT created_by FROM lost_items WHERE id = item_id) = auth.uid()
    OR is_admin_user(auth.uid())
  );

-- Admins can delete questions
DROP POLICY IF EXISTS "Admins can delete questions" ON item_questions;
CREATE POLICY "Admins can delete questions"
  ON item_questions FOR DELETE
  USING (is_admin_user(auth.uid()));

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. PERMISSIONS
-- ═══════════════════════════════════════════════════════════════════════════

GRANT SELECT, INSERT, UPDATE, DELETE ON item_questions TO authenticated;
GRANT SELECT ON item_questions TO anon;

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION COMPLETE ✅
-- ═══════════════════════════════════════════════════════════════════════════
-- Created:
--   ✅ item_questions table
--   ✅ RLS policies (anyone can ask, creator/admin can reply)
--
-- Features:
--   - Students ask questions about items
--   - Item finder can reply
--   - Admins can manage all questions
--   - Timestamp tracking
-- ═══════════════════════════════════════════════════════════════════════════
