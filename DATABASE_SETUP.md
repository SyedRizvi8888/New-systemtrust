# System Trust - Complete Database Setup Guide

## Overview
This guide provides all SQL scripts needed to set up the Lost & Found system database on Supabase. The system now includes proper admin restrictions preventing admins from claiming items.

## Installation Instructions

### Step 1: Create Your Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Copy your project URL and anon key to `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### Step 2: Run Database Migrations (In Order)

Run these scripts **in the Supabase SQL Editor** in the order listed:

#### 2.1 Main Schema (supabase-schema.sql)
- This creates all core tables and functions
- **Run this FIRST**

#### 2.2 Migration 2: Claim Evidence Support (migrations/002_claim_evidence_support.sql)
- Enables image uploads for claim proof

#### 2.3 Migration 3: Student Identity Fields (migrations/003_student_identity_and_workflow_columns.sql)
- Adds student ID and workflow fields

#### 2.4 Migration 4: Admin Restrictions (migrations/004_admin_restriction_updates.sql)
- **NEW** - Adds admin functionality and restrictions
- Prevents admins from claiming items
- Sets up admin messaging

### Step 3: Create Your First Admin User

In the Supabase SQL Editor, run:
```sql
-- Replace 'your.email@school.edu' with your actual email
INSERT INTO admin_users (user_id, email)
SELECT id, email
FROM auth.users
WHERE email = 'your.email@school.edu'
ON CONFLICT (user_id) DO NOTHING;
```

### Step 4: Test the Application

1. Start your Next.js app:
```bash
npm run dev
```

2. Create an account with your email
3. Run the admin SQL from Step 3
4. Sign out and back in
5. You should see the Admin Dashboard link in navigation

---

## Key Features Implemented

### Admin Dashboard
✅ Review pending claims in left sidebar
✅ View detailed claim information
✅ Approve, reject, or request more info on claims
✅ Send messages to claimants
✅ Add internal notes for team
✅ View case history and events
✅ Flag suspicious claims
✅ Mark items as returned/matched

### Admin Restrictions
✅ Admins CANNOT claim items (fixed in this update)
✅ Item creators CANNOT claim their own items
✅ Only eligible users can see "Claim This Item" button

### Claim Workflow
- Pending → Needs Info (request more proof)
- Pending → Approved (ready for pickup)
- Pending → Rejected (claim denied)
- Approved → Pickup Scheduled
- Pickup Scheduled → Returned (item given to claimant)

---

## Database Schema Overview

### Core Tables

#### lost_items
```
- id: UUID (primary key)
- title: TEXT
- description: TEXT
- category: TEXT (electronics, clothing, accessories, books, sports, keys, wallet, jewelry, bag, other)
- location: TEXT
- date_found: DATE
- status: TEXT (found, lost, under_review, matched, returned, archived)
- image_url: TEXT
- contact_email: TEXT
- contact_phone: TEXT
- student_id: TEXT
- student_name: TEXT
- grade: TEXT
- claimed_by: TEXT
- claimed_at: TIMESTAMPTZ
- created_by: UUID (references auth.users)
- admin_restricted: BOOLEAN (NEW)
- escalated_to_admin: BOOLEAN (NEW)
- created_at, updated_at: TIMESTAMPTZ
```

#### claim_requests
```
- id: UUID (primary key)
- item_id: UUID (references lost_items)
- claimant_name: TEXT
- claimant_email: TEXT
- claimant_phone: TEXT
- claimant_student_id: TEXT
- proof_description: TEXT
- status: TEXT (pending, needs_info, approved, rejected, pickup_scheduled, closed)
- submitted_at: TIMESTAMPTZ
- reviewed_at: TIMESTAMPTZ
- reviewed_by: UUID (references auth.users)
- internal_notes: TEXT
- admin_messages: JSONB (NEW)
- verified_by: UUID (NEW)
```

#### claim_cases
```
- id: UUID (primary key)
- claim_request_id: UUID (unique, references claim_requests)
- state: TEXT (new, triage, verification, approved, rejected, pickup_scheduled, closed)
- priority: TEXT (low, normal, high, urgent)
- assigned_to: UUID (references auth.users)
- sla_due_at: TIMESTAMPTZ
- closed_at: TIMESTAMPTZ
- created_at, updated_at: TIMESTAMPTZ
```

#### claim_case_events
```
- id: UUID (primary key)
- claim_case_id: UUID (references claim_cases)
- event_type: TEXT
- from_state: TEXT
- to_state: TEXT
- actor_user_id: UUID (references auth.users)
- notes: TEXT
- metadata: JSONB
- created_at: TIMESTAMPTZ
```

#### admin_messages (NEW)
```
- id: UUID (primary key)
- claim_request_id: UUID (references claim_requests)
- sent_by: UUID (references auth.users)
- recipient_email: TEXT
- message: TEXT
- status: TEXT (queued, sent, failed)
- sent_at: TIMESTAMPTZ
- created_at: TIMESTAMPTZ
```

#### admin_users
```
- id: UUID (primary key)
- user_id: UUID (unique, references auth.users)
- email: TEXT
- created_at, created_by: TIMESTAMPTZ & UUID
```

---

## Application-Level Changes

### ItemDetailPage.tsx
✅ Fixed: Admins can no longer claim items
- Added `isAdmin` check from `useAuth()`
- Updated `canClaim` condition to include `&& !isAdmin`

### AdminPage.tsx
- No changes needed (already supports all features)

---

## API Functions

### Core Functions
```typescript
// Items
fetchItems(): Promise<LostItem[]>
fetchItemById(id: string): Promise<LostItem>
updateItem(id: string, updates: Partial<LostItem>): Promise<LostItem>

// Claims
fetchClaims(): Promise<ClaimRequest[]>
createClaim(claim: ClaimRequest): Promise<ClaimRequest>
updateClaim(id: string, updates: Partial<ClaimRequest>): Promise<ClaimRequest>

// Claim Cases & Events
fetchClaimCases(): Promise<ClaimCase[]>
updateClaimCase(id: string, updates: Partial<ClaimCase>): Promise<ClaimCase>
fetchClaimCaseEvents(caseId: string): Promise<ClaimCaseEvent[]>
addClaimCaseEvent(event: ClaimCaseEvent): Promise<ClaimCaseEvent>

// Admin
isUserAdmin(userId: string): Promise<boolean>
sendAdminMessageToClaimant(params): Promise<void>

// Evidence
fetchEvidenceByClaim(claimId: string): Promise<any[]>
```

---

## Row Level Security (RLS) Policies

### General Rules
- Anyone can view items (public read)
- Authenticated users can create items/claims
- Privileged operators (admins) can manage all claims/cases
- Users can view their own data

### Admin Checks
The system uses two functions:
1. `is_admin_user()` - Checks `admin_users` table
2. `is_privileged_operator()` - Checks if user has admin role

---

## Troubleshooting

### "Admin users can view admin users" error
→ Make sure the `admin_users` table has RLS enabled

### Claims not updating
→ Verify `claim_cases` table exists and has proper RLS

### Can't send messages
→ Ensure `admin_messages` table is created (from migration 004)

### Admin can still claim items
→ Refresh the application (may need to clear browser cache)
→ Verify `isAdmin` is properly loaded in `AuthContext`

---

## Performance Indexes

The following indexes are created for performance:

```sql
-- lost_items
idx_lost_items_status
idx_lost_items_category
idx_lost_items_created_by
idx_lost_items_search (full-text search)

-- claim_requests
idx_claim_requests_item_id
idx_claim_requests_status

-- claim_cases
idx_claim_cases_state
idx_claim_cases_priority (if created)

-- admin_messages
idx_admin_messages_claim_id
idx_admin_messages_status
```

---

## Next Steps

1. ✅ Run all SQL migrations
2. ✅ Create your admin user
3. ✅ Test admin login
4. ✅ Test that admins cannot claim items
5. ✅ Test admin dashboard features
6. Deploy to production

---

## Support

For issues or questions:
- Check the GitHub repository
- Review Supabase documentation
- Check browser console for errors
- Review application logs
