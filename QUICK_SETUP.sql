-- ═══════════════════════════════════════════════════════════════════════════
-- FBLA LOST & FOUND — Quick Setup SQL (All-in-One)
-- ═══════════════════════════════════════════════════════════════════════════
--
-- This file contains all necessary SQL to set up the complete system.
-- Run this in your Supabase SQL Editor if you haven't already run the individual migration files.
--
-- If you've already run the individual migrations, NO NEED TO RUN THIS FILE.
-- ═══════════════════════════════════════════════════════════════════════════

-- Check: Is this your first time setting up?
-- If you haven't run ANY migrations yet, copy the content from supabase-schema.sql first

-- ═══════════════════════════════════════════════════════════════════════════
-- ADMIN SETUP: After running all migrations, add your admin user
-- ═══════════════════════════════════════════════════════════════════════════

-- Step 1: Create an account in the application

-- Step 2: Run this SQL (replace email with the one you signed up with):
--
-- INSERT INTO admin_users (user_id, email)
-- SELECT id, email
-- FROM auth.users
-- WHERE email = 'your.email@school.edu'
-- ON CONFLICT (user_id) DO NOTHING;

-- Step 3: Sign out and back in. You should now see the Admin Dashboard.

-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFY SETUP: Run these checks
-- ═══════════════════════════════════════════════════════════════════════════

-- Check 1: Verify all tables exist
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check 2: Verify core tables
SELECT COUNT(*) as table_count FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('lost_items', 'claim_requests', 'claim_cases', 'claim_case_events', 'admin_users', 'admin_messages');

-- Check 3: List all admin users
SELECT email, created_at FROM admin_users LIMIT 10;

-- Check 4: Get system stats
SELECT
  (SELECT COUNT(*) FROM lost_items) as total_items,
  (SELECT COUNT(*) FROM lost_items WHERE status = 'found') as found_items,
  (SELECT COUNT(*) FROM lost_items WHERE status = 'lost') as lost_items,
  (SELECT COUNT(*) FROM claim_requests) as total_claims,
  (SELECT COUNT(*) FROM claim_requests WHERE status = 'pending') as pending_claims,
  (SELECT COUNT(*) FROM admin_users) as admin_count;

-- ═══════════════════════════════════════════════════════════════════════════
-- TEST DATA: Insert sample data for testing (optional)
-- ═══════════════════════════════════════════════════════════════════════════

-- DO NOT RUN THIS IN PRODUCTION
-- Only run if you want test data for development

-- Insert test item:
-- INSERT INTO lost_items (
--   title, description, category, location, date_found, status,
--   contact_email, contact_phone, student_name, created_by
-- ) VALUES (
--   'Blue backpack',
--   'Contains laptop and textbooks',
--   'bag',
--   'Library - Lost & Found desk',
--   NOW()::date,
--   'found',
--   'admin@school.edu',
--   '555-1234',
--   'Admin Staff',
--   auth.uid()
-- );

-- ═══════════════════════════════════════════════════════════════════════════
-- MONITORING: Query dashboard stats
-- ═══════════════════════════════════════════════════════════════════════════

-- Get all pending claims with item details
SELECT
  cr.id as claim_id,
  cr.claimant_name,
  cr.claimant_email,
  li.title,
  li.location,
  cr.status,
  cc.priority,
  cr.submitted_at,
  CASE WHEN cr.status = 'pending' THEN 1 ELSE 0 END::int as needs_review
FROM claim_requests cr
JOIN lost_items li ON cr.item_id = li.id
LEFT JOIN claim_cases cc ON cc.claim_request_id = cr.id
ORDER BY cr.submitted_at DESC;

-- Get item statistics by status
SELECT
  status,
  COUNT(*) as count,
  TO_CHAR(AVG(EXTRACT(DAY FROM NOW() - date_found)), '99.0') as avg_days_old
FROM lost_items
GROUP BY status
ORDER BY count DESC;

-- Get admin activity log
SELECT
  cr.id as claim_id,
  cr.claimant_name,
  am.message,
  am.status,
  am.sent_at,
  u.email as sent_by
FROM admin_messages am
JOIN claim_requests cr ON am.claim_request_id = cr.id
LEFT JOIN auth.users u ON am.sent_by = u.id
ORDER BY am.created_at DESC
LIMIT 20;

-- ═══════════════════════════════════════════════════════════════════════════
-- MAINTENANCE: Clean up archived items (if needed)
-- ═══════════════════════════════════════════════════════════════════════════

-- Archive items older than 90 days with no claims
-- DO NOT RUN IN PRODUCTION
-- UPDATE lost_items
-- SET status = 'archived'
-- WHERE status = 'found'
--   AND date_found < CURRENT_DATE - INTERVAL '90 days'
--   AND id NOT IN (SELECT item_id FROM claim_requests);

-- ═══════════════════════════════════════════════════════════════════════════
-- DEBUGGING: Common queries
-- ═══════════════════════════════════════════════════════════════════════════

-- Find claims for a specific item
SELECT * FROM claim_requests WHERE item_id = 'ITEM_ID_HERE';

-- Find all claims by a claimant
SELECT * FROM claim_requests WHERE claimant_email = 'user@school.edu';

-- Get claim case timeline
SELECT
  event_type,
  from_state,
  to_state,
  created_at,
  notes
FROM claim_case_events
WHERE claim_case_id = 'CASE_ID_HERE'
ORDER BY created_at ASC;

-- Check admin user privileges
SELECT ur.* FROM user_roles ur
WHERE ur.user_id = 'USER_ID_HERE';

-- ═══════════════════════════════════════════════════════════════════════════
-- END OF SETUP
-- ═══════════════════════════════════════════════════════════════════════════
