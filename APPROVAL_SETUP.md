# Admin Item Approval System - Setup Guide

## Overview

Students can now submit items that are **NOT immediately visible**. Admins must approve items first before they appear in searches.

**Flow:**
```
Student Submit → approval_status='pending' → NOT visible
                           ↓ (admin reviews)
                           → 'approved' → VISIBLE to all
                           OR 'rejected' → HIDDEN from public
```

## Changes Made

### 1. **Database Schema** (`migrations/005_item_approval_workflow.sql`)

Added 4 new columns to `lost_items` table:
- `approval_status` (pending | approved | rejected) - default: 'approved' (backwards compatible)
- `approved_by` - admin user ID who approved/rejected
- `approved_at` - timestamp of approval
- `rejection_reason` - why it was rejected

### 2. **Admin Dashboard** (Complete Rebuild)

New `AdminPage.tsx` with:
- **Pending Approval Tab** - Shows items needing review (with red alert indicator)
- **All Items Tab** - Shows all items with search
- **Stats Cards** - Pending, Approved, Rejected, Total counts
- **Approve/Reject Buttons** - With reason input for rejections
- **Real-time Updates** - Dashboard refreshes after each action

### 3. **API Updates** (`lib/api.ts`)

Updated item mapping to include approval fields:
```typescript
approvalStatus?: 'pending' | 'approved' | 'rejected';
approvedBy?: string;
approvedAt?: string;
rejectionReason?: string;
```

### 4. **Student Submission** (`pages/ReportPage.tsx`)

New items created with:
```typescript
approvalStatus: 'pending'
```

Plus updated success modal messages explaining items need approval.

---

## 🔧 Installation Steps

### Step 1: Run the SQL Migration

Go to `Supabase → SQL Editor` and run:

```sql
-- Copy everything from:
migrations/005_item_approval_workflow.sql
```

This will:
- Add the 4 new columns
- Create RLS policies to hide pending items from public
- Set all existing items to 'approved' (no breaking change)

### Step 2: Verify Code Changes

The following files are already updated:
- ✅ `src/pages/AdminPage.tsx` - Complete rewrite
- ✅ `src/pages/ReportPage.tsx` - Now sets `approvalStatus: 'pending'`
- ✅ `src/components/SubmissionSuccessModal.tsx` - Updated messages
- ✅ `src/types/index.ts` - Added approval fields
- ✅ `src/lib/api.ts` - Updated mappers

### Step 3: Test the Flow

1. **Student submits an item**
   - Item appears as pending (not in search yet)
   - Student sees success modal: "Under admin review"

2. **Admin views dashboard **
   - Items show in "Pending Approval" tab
   - Stats show pending count (with red alert dot)

3. **Admin approves**
   - Click "Approve" button
   - Item now visible in searches (approval_status = 'approved')

4. **Admin rejects**
   - Click "Reject" → enter reason
   - Item hidden from public
   - Student can only see their own rejected item

---

## 🗄️ Full SQL for Manual Setup

If you need to just copy-paste the SQL:

```sql
BEGIN;

-- Add columns
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

-- Enable RLS
ALTER TABLE lost_items ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Anyone can view lost items" ON lost_items;
DROP POLICY IF EXISTS "Authenticated users can view lost items" ON lost_items;
DROP POLICY IF EXISTS "Users can view approved items and own items" ON lost_items;

-- New SELECT policy
CREATE POLICY "View approved items or own items"
  ON lost_items FOR SELECT
  USING (
    approval_status = 'approved'
    OR created_by = auth.uid()
    OR (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
  );

-- New INSERT policy
DROP POLICY IF EXISTS "Anyone can create lost items" ON lost_items;
DROP POLICY IF EXISTS "Authenticated users can create lost items" ON lost_items;

CREATE POLICY "Authenticated users can insert items"
  ON lost_items FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Update policy
DROP POLICY IF EXISTS "Authenticated users can update lost items" ON lost_items;
DROP POLICY IF EXISTS "Item creators and admins can update items" ON lost_items;

CREATE POLICY "Item creators can update own items"
  ON lost_items FOR UPDATE
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Admins can update items"
  ON lost_items FOR UPDATE
  USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true)
  WITH CHECK ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true);

-- Delete policy
DROP POLICY IF EXISTS "Authenticated users can delete lost items" ON lost_items;
DROP POLICY IF EXISTS "Admins can delete items" ON lost_items;

CREATE POLICY "Admins can delete items"
  ON lost_items FOR DELETE
  USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true);

-- Set existing items to approved
UPDATE lost_items
SET approval_status = 'approved', approved_at = NOW()
WHERE approval_status IS NULL OR approval_status = 'pending';

COMMIT;
```

---

## 📊 Database Schema

```
lost_items table
├── id (UUID)
├── title (TEXT)
├── description (TEXT)
├── ... existing fields ...
│
├── approval_status (TEXT) ← NEW: 'pending'|'approved'|'rejected'
├── approved_by (UUID) ← NEW: admin user ID
├── approved_at (TIMESTAMPTZ) ← NEW: when decided
├── rejection_reason (TEXT) ← NEW: why rejected
│
└── created_at, updated_at, created_by
```

---

## 🔐 Row-Level Security (RLS)

**For Regular Users (Students):**
- ✅ Can see items with `approval_status = 'approved'`
- ✅ Can see their own items (even if pending/rejected)
- ✅ Can create new items (start as pending)

**For Admins:**
- ✅ Can see ALL items (pending, approved, rejected)
- ✅ Can update/approve/reject items
- ✅ Can delete items

---

## 🎯 What's Different Now

**Before:**
- Students submit → item appears immediately in search

**After:**
- Students submit → item is HIDDEN pending approval
- Admins review in new "Pending Approval" tab
- Admins click Approve/Reject
- Only approved items show in public search

---

## ⚙️ Admin Dashboard URLs

- `/admin` - Full admin dashboard
  - **Pending Approval** tab - New items to review (RED ALERT if count > 0)
  - **All Items** tab - Complete item list with search

---

## 🚨 Important Notes

1. **Backwards Compatibility**: All existing items default to `approval_status = 'approved'` so nothing breaks
2. **Students see pending**: Their own submissions are visible to them even if pending
3. **Admins see everything**: All statuses visible in admin dashboard
4. **Reasons required**: Rejecting requires a reason (shown to admin/student)

---

## ✅ Testing Checklist

- [ ] Run SQL migration in Supabase
- [ ] Student submits item → appears as pending
- [ ] Admin dashboard shows Pending count
- [ ] Admin approves → item visible in search
- [ ] Admin rejects → item hidden, reason saved
- [ ] Student sees their own pending item
- [ ] Public doesn't see pending items
- [ ] Old items still work (auto-approved)

