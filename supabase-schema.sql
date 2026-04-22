-- ═══════════════════════════════════════════════════════════════════════════
-- FBLA LOST & FOUND — Supabase Database Schema
-- ═══════════════════════════════════════════════════════════════════════════
-- 
-- Run this SQL in your Supabase SQL Editor to set up the database tables,
-- Row Level Security (RLS) policies, and indexes.
--
-- Instructions:
-- 1. Go to your Supabase project dashboard
-- 2. Navigate to SQL Editor
-- 3. Copy and paste this entire file
-- 4. Click "Run" to execute
-- ═══════════════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────────────────
-- Enable UUID extension (if not already enabled)
-- ────────────────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ────────────────────────────────────────────────────────────────────────────
-- Table: lost_items
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lost_items (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
title TEXT NOT NULL,
description TEXT NOT NULL,
category TEXT NOT NULL CHECK (category IN (
'electronics', 'clothing', 'accessories', 'books', 'sports',
'keys', 'wallet', 'jewelry', 'bag', 'other'
)),
location TEXT NOT NULL,
date_found DATE NOT NULL,
status TEXT NOT NULL DEFAULT 'found' CHECK (status IN ('found', 'lost', 'under_review', 'matched', 'returned', 'archived')),
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
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ────────────────────────────────────────────────────────────────────────────
-- Table: claim_requests
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS claim_requests (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
item_id UUID NOT NULL REFERENCES lost_items(id) ON DELETE CASCADE,
claimant_name TEXT NOT NULL,
claimant_email TEXT NOT NULL,
claimant_phone TEXT,
claimant_student_id TEXT,
proof_description TEXT NOT NULL,
preferred_contact_method TEXT,
status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'needs_info', 'approved', 'rejected', 'pickup_scheduled', 'closed')),
submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
reviewed_at TIMESTAMPTZ,
reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
internal_notes TEXT
);

-- ────────────────────────────────────────────────────────────────────────────
-- Indexes for Performance
-- ────────────────────────────────────────────────────────────────────────────

-- Lost Items Indexes
CREATE INDEX IF NOT EXISTS idx_lost_items_status ON lost_items(status);
CREATE INDEX IF NOT EXISTS idx_lost_items_category ON lost_items(category);
CREATE INDEX IF NOT EXISTS idx_lost_items_date_found ON lost_items(date_found DESC);
CREATE INDEX IF NOT EXISTS idx_lost_items_created_at ON lost_items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lost_items_created_by ON lost_items(created_by);
CREATE INDEX IF NOT EXISTS idx_lost_items_search ON lost_items USING gin(to_tsvector('english', title || ' ' || description || ' ' || location));

-- Claim Requests Indexes
CREATE INDEX IF NOT EXISTS idx_claim_requests_item_id ON claim_requests(item_id);
CREATE INDEX IF NOT EXISTS idx_claim_requests_status ON claim_requests(status);
CREATE INDEX IF NOT EXISTS idx_claim_requests_submitted_at ON claim_requests(submitted_at DESC);

-- ────────────────────────────────────────────────────────────────────────────
-- Function: Update updated_at timestamp
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-update updated_at on lost_items
DROP TRIGGER IF EXISTS update_lost_items_updated_at ON lost_items;
CREATE TRIGGER update_lost_items_updated_at
BEFORE UPDATE ON lost_items
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ────────────────────────────────────────────────────────────────────────────
-- Row Level Security (RLS) Policies
-- ────────────────────────────────────────────────────────────────────────────

-- Enable RLS on both tables
ALTER TABLE lost_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_requests ENABLE ROW LEVEL SECURITY;

-- ────────────────────────────────────────────────────────────────────────────
-- Lost Items Policies
-- ────────────────────────────────────────────────────────────────────────────

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view lost items" ON lost_items;
DROP POLICY IF EXISTS "Authenticated users can create lost items" ON lost_items;
DROP POLICY IF EXISTS "Authenticated users can update lost items" ON lost_items;
DROP POLICY IF EXISTS "Authenticated users can delete lost items" ON lost_items;

-- Policy: Anyone can read (view) lost items
CREATE POLICY "Anyone can view lost items"
ON lost_items
FOR SELECT
USING (true);

-- Policy: Anyone can create lost items (parity with previous local mode)
CREATE POLICY "Anyone can create lost items"
ON lost_items
FOR INSERT
WITH CHECK (true);

-- Policy: Authenticated users can update lost items
CREATE POLICY "Authenticated users can update lost items"
ON lost_items
FOR UPDATE
USING (auth.role() = 'authenticated');

-- Policy: Authenticated users can delete lost items
CREATE POLICY "Authenticated users can delete lost items"
ON lost_items
FOR DELETE
USING (auth.role() = 'authenticated');

-- ────────────────────────────────────────────────────────────────────────────
-- Claim Requests Policies
-- ────────────────────────────────────────────────────────────────────────────

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view claim requests" ON claim_requests;
DROP POLICY IF EXISTS "Anyone can create claim requests" ON claim_requests;
DROP POLICY IF EXISTS "Authenticated users can update claim requests" ON claim_requests;
DROP POLICY IF EXISTS "Authenticated users can delete claim requests" ON claim_requests;

-- Policy: Anyone can read claim requests (for viewing claims on items)
CREATE POLICY "Anyone can view claim requests"
ON claim_requests
FOR SELECT
USING (true);

-- Policy: Anyone can create claim requests (for submitting claims)
CREATE POLICY "Anyone can create claim requests"
ON claim_requests
FOR INSERT
WITH CHECK (true);

-- Policy: Authenticated users can update claim requests (for admin approval/rejection)
CREATE POLICY "Authenticated users can update claim requests"
ON claim_requests
FOR UPDATE
USING (auth.role() = 'authenticated');

-- Policy: Authenticated users can delete claim requests
CREATE POLICY "Authenticated users can delete claim requests"
ON claim_requests
FOR DELETE
USING (auth.role() = 'authenticated');

-- ────────────────────────────────────────────────────────────────────────────
-- Table: admin_users (for tracking admin accounts)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_users (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
email TEXT NOT NULL,
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Index for admin_users
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);

-- Enable RLS on admin_users
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view admin users" ON admin_users;
DROP POLICY IF EXISTS "Admins can add admin users" ON admin_users;

-- Helper function to avoid recursive RLS checks on admin_users
CREATE OR REPLACE FUNCTION is_admin_user(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
SELECT EXISTS (
SELECT 1
FROM admin_users
WHERE user_id = target_user_id
);
$$;

REVOKE ALL ON FUNCTION is_admin_user(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION is_admin_user(UUID) TO authenticated;

-- Policy: Only admins can view admin_users
CREATE POLICY "Admins can view admin users"
ON admin_users
FOR SELECT
USING (is_admin_user(auth.uid()));

-- Policy: Only admins can insert admin_users
CREATE POLICY "Admins can add admin users"
ON admin_users
FOR INSERT
WITH CHECK (is_admin_user(auth.uid()));

-- ────────────────────────────────────────────────────────────────────────────
-- Create Demo Admin Account
-- ────────────────────────────────────────────────────────────────────────────
-- 
-- To create a demo admin account:
-- 1. Sign up/login with email: demo-admin@school.edu (or any email you prefer)
-- 2. Run this SQL (replace email with the one you used):
--
-- INSERT INTO admin_users (user_id, email) 
-- SELECT id, email 
-- FROM auth.users 
-- WHERE email = 'demo-admin@school.edu'
-- ON CONFLICT (user_id) DO NOTHING;
--
-- Or create a function to automatically make the first user an admin:
CREATE OR REPLACE FUNCTION make_first_user_admin()
RETURNS TRIGGER AS $$
BEGIN
-- If this is the first user, make them an admin
IF (SELECT COUNT(*) FROM auth.users) = 1 THEN
INSERT INTO admin_users (user_id, email)
VALUES (NEW.id, NEW.email)
ON CONFLICT (user_id) DO NOTHING;
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-admin first user (optional - comment out if not wanted)
-- DROP TRIGGER IF EXISTS on_auth_user_created_make_admin ON auth.users;
-- CREATE TRIGGER on_auth_user_created_make_admin
--   AFTER INSERT ON auth.users
--   FOR EACH ROW
--   EXECUTE FUNCTION make_first_user_admin();

-- ────────────────────────────────────────────────────────────────────────────
-- Table: profiles (for user profile information)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
username TEXT NOT NULL UNIQUE,
full_name TEXT,
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for profiles
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- Trigger: Auto-update updated_at on profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile"
ON profiles
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own profile
CREATE POLICY "Users can insert own profile"
ON profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
ON profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────────────────────
-- Enterprise Foundation: Tenancy, RBAC, Workflow, Notifications, Audit
-- ────────────────────────────────────────────────────────────────────────────

-- Organizations and sites (district/school hierarchy)
CREATE TABLE IF NOT EXISTS organizations (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
name TEXT NOT NULL,
org_type TEXT NOT NULL DEFAULT 'school_district' CHECK (org_type IN ('school_district', 'school', 'department')),
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sites (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
name TEXT NOT NULL,
code TEXT UNIQUE,
timezone TEXT DEFAULT 'America/New_York',
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at
BEFORE UPDATE ON organizations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sites_updated_at ON sites;
CREATE TRIGGER update_sites_updated_at
BEFORE UPDATE ON sites
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Role definitions and user role assignments
CREATE TABLE IF NOT EXISTS role_definitions (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
role_key TEXT NOT NULL UNIQUE,
role_name TEXT NOT NULL,
scope TEXT NOT NULL CHECK (scope IN ('global', 'organization', 'site')),
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_roles (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
role_key TEXT NOT NULL REFERENCES role_definitions(role_key) ON DELETE RESTRICT,
organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_key ON user_roles(role_key);
CREATE INDEX IF NOT EXISTS idx_user_roles_org_id ON user_roles(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_site_id ON user_roles(site_id);

INSERT INTO role_definitions (role_key, role_name, scope)
VALUES
('student', 'Student', 'site'),
('staff', 'Staff', 'site'),
('admin', 'Admin', 'site'),
('district_admin', 'District Admin', 'organization')
ON CONFLICT (role_key) DO NOTHING;

-- Optional site/org linkage for existing business tables
ALTER TABLE lost_items ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;
ALTER TABLE lost_items ADD COLUMN IF NOT EXISTS site_id UUID REFERENCES sites(id) ON DELETE SET NULL;
ALTER TABLE claim_requests ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;
ALTER TABLE claim_requests ADD COLUMN IF NOT EXISTS site_id UUID REFERENCES sites(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_lost_items_org_id ON lost_items(organization_id);
CREATE INDEX IF NOT EXISTS idx_lost_items_site_id ON lost_items(site_id);
CREATE INDEX IF NOT EXISTS idx_claim_requests_org_id ON claim_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_claim_requests_site_id ON claim_requests(site_id);

-- Claims case workflow
CREATE TABLE IF NOT EXISTS claim_cases (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
claim_request_id UUID NOT NULL UNIQUE REFERENCES claim_requests(id) ON DELETE CASCADE,
state TEXT NOT NULL DEFAULT 'new' CHECK (state IN ('new', 'triage', 'verification', 'approved', 'rejected', 'pickup_scheduled', 'closed')),
priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
sla_due_at TIMESTAMPTZ,
closed_at TIMESTAMPTZ,
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS claim_case_events (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
claim_case_id UUID NOT NULL REFERENCES claim_cases(id) ON DELETE CASCADE,
event_type TEXT NOT NULL,
from_state TEXT,
to_state TEXT,
actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
notes TEXT,
metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_claim_cases_state ON claim_cases(state);
CREATE INDEX IF NOT EXISTS idx_claim_cases_assigned_to ON claim_cases(assigned_to);
CREATE INDEX IF NOT EXISTS idx_claim_cases_sla_due_at ON claim_cases(sla_due_at);
CREATE INDEX IF NOT EXISTS idx_claim_case_events_case_id ON claim_case_events(claim_case_id);
CREATE INDEX IF NOT EXISTS idx_claim_case_events_created_at ON claim_case_events(created_at DESC);

DROP TRIGGER IF EXISTS update_claim_cases_updated_at ON claim_cases;
CREATE TRIGGER update_claim_cases_updated_at
BEFORE UPDATE ON claim_cases
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Claim evidence and trust scoring
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

CREATE INDEX IF NOT EXISTS idx_claim_evidence_claim_id ON claim_evidence(claim_request_id);

-- Matching intelligence queue
CREATE TABLE IF NOT EXISTS item_matches (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
lost_item_id UUID NOT NULL REFERENCES lost_items(id) ON DELETE CASCADE,
found_item_id UUID NOT NULL REFERENCES lost_items(id) ON DELETE CASCADE,
confidence_score NUMERIC(5,2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
status TEXT NOT NULL DEFAULT 'suggested' CHECK (status IN ('suggested', 'accepted', 'rejected')),
explanation TEXT,
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
UNIQUE(lost_item_id, found_item_id)
);

CREATE INDEX IF NOT EXISTS idx_item_matches_lost_item_id ON item_matches(lost_item_id);
CREATE INDEX IF NOT EXISTS idx_item_matches_found_item_id ON item_matches(found_item_id);
CREATE INDEX IF NOT EXISTS idx_item_matches_score ON item_matches(confidence_score DESC);

-- Notifications and delivery tracking
CREATE TABLE IF NOT EXISTS notification_templates (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
template_key TEXT NOT NULL UNIQUE,
channel TEXT NOT NULL CHECK (channel IN ('email', 'sms', 'push')),
subject TEXT,
body TEXT NOT NULL,
is_active BOOLEAN NOT NULL DEFAULT TRUE,
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notification_deliveries (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
recipient_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
recipient_email TEXT,
channel TEXT NOT NULL CHECK (channel IN ('email', 'sms', 'push')),
template_key TEXT,
status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'sent', 'failed', 'cancelled')),
attempts INTEGER NOT NULL DEFAULT 0,
last_error TEXT,
metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
scheduled_for TIMESTAMPTZ,
sent_at TIMESTAMPTZ,
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_deliveries_status ON notification_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_notification_deliveries_scheduled_for ON notification_deliveries(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_notification_deliveries_recipient_user ON notification_deliveries(recipient_user_id);

DROP TRIGGER IF EXISTS update_notification_templates_updated_at ON notification_templates;
CREATE TRIGGER update_notification_templates_updated_at
BEFORE UPDATE ON notification_templates
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_notification_deliveries_updated_at ON notification_deliveries;
CREATE TRIGGER update_notification_deliveries_updated_at
BEFORE UPDATE ON notification_deliveries
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Audit trail
CREATE TABLE IF NOT EXISTS audit_logs (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
entity_type TEXT NOT NULL,
entity_id UUID,
action TEXT NOT NULL,
before_data JSONB,
after_data JSONB,
ip_address INET,
user_agent TEXT,
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Enable RLS on new tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_case_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Base helper to identify privileged operators
CREATE OR REPLACE FUNCTION is_privileged_operator(target_user_id UUID)
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

REVOKE ALL ON FUNCTION is_privileged_operator(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION is_privileged_operator(UUID) TO authenticated;

-- Policies for operators on foundational tables
DROP POLICY IF EXISTS "Privileged users can view organizations" ON organizations;
DROP POLICY IF EXISTS "Privileged users can manage organizations" ON organizations;
CREATE POLICY "Privileged users can view organizations"
ON organizations FOR SELECT
USING (is_privileged_operator(auth.uid()));
CREATE POLICY "Privileged users can manage organizations"
ON organizations FOR ALL
USING (is_privileged_operator(auth.uid()))
WITH CHECK (is_privileged_operator(auth.uid()));

DROP POLICY IF EXISTS "Privileged users can view sites" ON sites;
DROP POLICY IF EXISTS "Privileged users can manage sites" ON sites;
CREATE POLICY "Privileged users can view sites"
ON sites FOR SELECT
USING (is_privileged_operator(auth.uid()));
CREATE POLICY "Privileged users can manage sites"
ON sites FOR ALL
USING (is_privileged_operator(auth.uid()))
WITH CHECK (is_privileged_operator(auth.uid()));

DROP POLICY IF EXISTS "Authenticated can view role definitions" ON role_definitions;
CREATE POLICY "Authenticated can view role definitions"
ON role_definitions FOR SELECT
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Privileged users can manage user roles" ON user_roles;
CREATE POLICY "Privileged users can manage user roles"
ON user_roles FOR ALL
USING (is_privileged_operator(auth.uid()))
WITH CHECK (is_privileged_operator(auth.uid()));

DROP POLICY IF EXISTS "Authenticated can view claim cases" ON claim_cases;
DROP POLICY IF EXISTS "Privileged can manage claim cases" ON claim_cases;
CREATE POLICY "Authenticated can view claim cases"
ON claim_cases FOR SELECT
USING (auth.role() = 'authenticated');
CREATE POLICY "Privileged can manage claim cases"
ON claim_cases FOR ALL
USING (is_privileged_operator(auth.uid()))
WITH CHECK (is_privileged_operator(auth.uid()));

DROP POLICY IF EXISTS "Authenticated can view claim case events" ON claim_case_events;
DROP POLICY IF EXISTS "Privileged can manage claim case events" ON claim_case_events;
CREATE POLICY "Authenticated can view claim case events"
ON claim_case_events FOR SELECT
USING (auth.role() = 'authenticated');
CREATE POLICY "Privileged can manage claim case events"
ON claim_case_events FOR ALL
USING (is_privileged_operator(auth.uid()))
WITH CHECK (is_privileged_operator(auth.uid()));

DROP POLICY IF EXISTS "Authenticated can view own claim evidence" ON claim_evidence;
DROP POLICY IF EXISTS "Authenticated can insert claim evidence" ON claim_evidence;
DROP POLICY IF EXISTS "Privileged can manage claim evidence" ON claim_evidence;
CREATE POLICY "Authenticated can view own claim evidence"
ON claim_evidence FOR SELECT
USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can insert claim evidence"
ON claim_evidence FOR INSERT
WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Privileged can manage claim evidence"
ON claim_evidence FOR UPDATE
USING (is_privileged_operator(auth.uid()))
WITH CHECK (is_privileged_operator(auth.uid()));

DROP POLICY IF EXISTS "Authenticated can view matches" ON item_matches;
DROP POLICY IF EXISTS "Privileged can manage matches" ON item_matches;
CREATE POLICY "Authenticated can view matches"
ON item_matches FOR SELECT
USING (auth.role() = 'authenticated');
CREATE POLICY "Privileged can manage matches"
ON item_matches FOR ALL
USING (is_privileged_operator(auth.uid()))
WITH CHECK (is_privileged_operator(auth.uid()));

DROP POLICY IF EXISTS "Privileged can manage templates" ON notification_templates;
CREATE POLICY "Privileged can manage templates"
ON notification_templates FOR ALL
USING (is_privileged_operator(auth.uid()))
WITH CHECK (is_privileged_operator(auth.uid()));

DROP POLICY IF EXISTS "Users can view own notifications" ON notification_deliveries;
DROP POLICY IF EXISTS "Privileged can manage notifications" ON notification_deliveries;
CREATE POLICY "Users can view own notifications"
ON notification_deliveries FOR SELECT
USING (recipient_user_id = auth.uid() OR is_privileged_operator(auth.uid()));
CREATE POLICY "Privileged can manage notifications"
ON notification_deliveries FOR ALL
USING (is_privileged_operator(auth.uid()))
WITH CHECK (is_privileged_operator(auth.uid()));

DROP POLICY IF EXISTS "Privileged can view audit logs" ON audit_logs;
DROP POLICY IF EXISTS "System can insert audit logs" ON audit_logs;
CREATE POLICY "Privileged can view audit logs"
ON audit_logs FOR SELECT
USING (is_privileged_operator(auth.uid()));
CREATE POLICY "System can insert audit logs"
ON audit_logs FOR INSERT
WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- ────────────────────────────────────────────────────────────────────────────
-- Optional: Create a view for dashboard stats
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT
(SELECT COUNT(*) FROM lost_items) as total_items,
(SELECT COUNT(*) FROM lost_items WHERE status = 'found') as active_items,
(SELECT COUNT(*) FROM lost_items WHERE status = 'returned') as returned_items,
(SELECT COUNT(*) FROM claim_requests WHERE status = 'pending') as pending_claims;

-- ────────────────────────────────────────────────────────────────────────────
-- Grant permissions (if needed for service role)
-- ────────────────────────────────────────────────────────────────────────────
-- Note: These are usually handled automatically by Supabase, but included for completeness
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON lost_items TO anon, authenticated;
GRANT ALL ON claim_requests TO anon, authenticated;
GRANT ALL ON profiles TO anon, authenticated;
GRANT ALL ON admin_users TO anon, authenticated;
GRANT ALL ON organizations TO authenticated;
GRANT ALL ON sites TO authenticated;
GRANT ALL ON role_definitions TO authenticated;
GRANT ALL ON user_roles TO authenticated;
GRANT ALL ON claim_cases TO authenticated;
GRANT ALL ON claim_case_events TO authenticated;
GRANT ALL ON claim_evidence TO authenticated;
GRANT ALL ON item_matches TO authenticated;
GRANT ALL ON notification_templates TO authenticated;
GRANT ALL ON notification_deliveries TO authenticated;
GRANT ALL ON audit_logs TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- Setup Complete!
-- ═══════════════════════════════════════════════════════════════════════════
-- 
-- Next Steps:
-- 1. Set up your environment variables:
--    - NEXT_PUBLIC_SUPABASE_URL=your-project-url
--    - NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
--
-- 2. Configure Authentication in Supabase Dashboard:
--    - Go to Authentication > Settings
--    - Enable Email provider
--    - Configure email templates if desired
--
-- 3. Test the application:
--    - Create a user account via the signup page
--    - Try creating, reading, updating, and deleting items
--    - Test claim request functionality
--
-- ═══════════════════════════════════════════════════════════════════════════

