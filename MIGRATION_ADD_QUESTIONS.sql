-- ═══════════════════════════════════════════════════════════════════════════
-- ADD QUESTIONS FEATURE & REMOVE ARCHIVED STATUS
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. CREATE item_questions TABLE
-- ═══════════════════════════════════════════════════════════════════════════

DROP TABLE IF EXISTS item_questions CASCADE;

CREATE TABLE item_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID NOT NULL REFERENCES lost_items(id) ON DELETE CASCADE,
  asked_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asked_by_name TEXT NOT NULL,
  asked_by_email TEXT NOT NULL,
  question_text TEXT NOT NULL,
  reply_text TEXT,
  replied_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  replied_at TIMESTAMPTZ,
  status TEXT DEFAULT 'unanswered' CHECK (status IN ('unanswered', 'answered', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_item_questions_item_id ON item_questions(item_id);
CREATE INDEX idx_item_questions_status ON item_questions(status);
CREATE INDEX idx_item_questions_created_at ON item_questions(created_at DESC);
CREATE INDEX idx_item_questions_asked_by ON item_questions(asked_by_user_id);

-- Trigger for auto-update
DROP TRIGGER IF EXISTS update_item_questions_updated_at ON item_questions;
CREATE TRIGGER update_item_questions_updated_at
  BEFORE UPDATE ON item_questions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE item_questions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view item questions"
  ON item_questions FOR SELECT
  USING (true);

CREATE POLICY "Authenticated can ask questions"
  ON item_questions FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Item creator can reply to questions"
  ON item_questions FOR UPDATE
  USING (
    (SELECT created_by FROM lost_items WHERE id = item_id) = auth.uid()
    OR is_admin_user(auth.uid())
  )
  WITH CHECK (
    (SELECT created_by FROM lost_items WHERE id = item_id) = auth.uid()
    OR is_admin_user(auth.uid())
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. REMOVE archived FROM status enum (don't auto-archive)
-- ═══════════════════════════════════════════════════════════════════════════

-- Update constraint to remove 'archived' option
ALTER TABLE lost_items DROP CONSTRAINT IF EXISTS lost_items_status_check;
ALTER TABLE lost_items ADD CONSTRAINT lost_items_status_check
  CHECK (status IN ('found', 'lost', 'under_review', 'matched', 'returned'));

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. SET any archived items back to matched/returned
-- ═══════════════════════════════════════════════════════════════════════════

UPDATE lost_items SET status = 'returned' WHERE status = 'archived';

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION COMPLETE ✅
-- ═══════════════════════════════════════════════════════════════════════════
-- Created:
--   ✅ item_questions table
--   ✅ Students can ask questions
--   ✅ Item creators/admins can reply
--
-- Removed:
--   ✅ 'archived' status (use 'returned' instead)
--   ✅ All archived items moved to 'returned'
-- ═══════════════════════════════════════════════════════════════════════════
