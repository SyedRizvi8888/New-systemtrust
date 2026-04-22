# 🎯 COMPLETE LOST & FOUND SYSTEM - SETUP & CODE GUIDE

## ⚡ Quick Start (JUST RUN THIS)

### Step 1: Run SQL in Supabase
1. Go to **Supabase → SQL Editor**
2. Copy EVERYTHING from: `COMPLETE_SETUP.sql`
3. Paste and click **RUN**
4. Done ✅

All tables, security, functions, everything is now set up.

---

## 📊 Database Schema

### Tables Created:

```
lost_items
├── id, title, description, category, location, date_found
├── status: 'found'|'lost'|'under_review'|'matched'|'returned'|'archived'
├── approval_status: 'pending'|'approved'|'rejected' ← NEW
├── approved_by, approved_at, rejection_reason ← NEW
└── created_by (student who reported)

claim_requests
├── id, item_id, claimant_name, claimant_email
├── proof_description, status: 'pending'|'needs_info'|'approved'|'rejected'|'pickup_scheduled'|'closed'
└── submitted_at, reviewed_at, reviewed_by, internal_notes

claim_cases ← Tracks entire claim workflow
├── id, claim_request_id (1:1 link)
├── state: 'open'|'verification'|'approved'|'rejected'|'pickup_scheduled'|'closed'
├── priority: 'low'|'normal'|'high'|'urgent'
├── assigned_to (admin), sla_due_at
└── created_at, updated_at

claim_case_events ← Audit trail of all claim actions
├── id, claim_case_id, event_type
├── from_state → to_state (what changed)
├── actor_user_id (who did it), notes
└── metadata (extra data), created_at

claim_evidence ← Student uploads proof photos
├── id, claim_id, file_url, file_name, file_type
└── uploaded_at

admin_users
├── id, user_id, email
└── created_at, created_by

admin_action_logs ← Audit trail of admin actions
├── id, admin_id, action, table_name, record_id
├── details
└── created_at

profiles ← Extended user data
├── id (references auth.users), is_admin
└── created_at, updated_at
```

---

## 🔐 Security (RLS Policies)

### Students See:
✅ All **approved** items (public)
✅ Their own items (even if pending/rejected)
✅ Can create items (start as pending)

### Admins See:
✅ ALL items (pending, approved, rejected)
✅ ALL claims
✅ ALL claim cases
✅ Can approve/reject items
✅ Can manage claims

### Public (Unauthenticated):
❌ Only approved items in searches

---

## 💻 Frontend Code

### 1. **Admin Dashboard** - Item Approval
Location: `src/pages/AdminPage.tsx`

```typescript
// Shows items pending approval
const pendingItems = items.filter(i => i.approvalStatus === 'pending');

// Approve button
await updateItem(item.id, { approvalStatus: 'approved' });

// Reject with reason
await updateItem(item.id, {
  approvalStatus: 'rejected',
  rejectionReason: 'Item description unclear'
});
```

### 2. **Student Report Page**
Location: `src/pages/ReportPage.tsx`

```typescript
// When student submits:
await createItem({
  title, description, category, location,
  status: reportType,
  approvalStatus: 'pending', // ← Items start here
  createdBy: user.id,
});

// Success message says:
// "Under admin review - office will contact you when approved"
```

### 3. **Types**
Location: `src/types/index.ts`

```typescript
export interface LostItem {
  // ... existing fields
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
}

export interface ClaimCase {
  id: string;
  claimRequestId: string;
  state: 'open' | 'verification' | 'approved' | 'rejected' | 'pickup_scheduled' | 'closed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  assignedTo?: string;
  slaDueAt?: string;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
}
```

### 4. **API Functions** - All Already Exist!
Location: `src/lib/api.ts`

```typescript
// Items
fetchItems() → gets all items
fetchItemById(id) → single item
createItem(item) → new item (starts as pending)
updateItem(id, updates) → change status/approval
deleteItem(id) → remove

// Claims
fetchClaims() → all claims
createClaim(claim) → student submits claim
updateClaim(id, updates) → admin actions
fetchClaimsByEmail(email) → claims by student

// Claim Cases (tracks workflow)
fetchClaimCases() → all cases
fetchClaimCaseByClaimId(claimId) → get case for claim
ensureClaimCaseForClaim(claimId) → auto-create if needed
updateClaimCase(id, updates) → change state/priority
fetchClaimCaseEvents(caseId) → audit trail

// Events (audit log)
addClaimCaseEvent(params) → log what happened
fetchClaimCaseEvents(caseId) → see history

// Evidence (photos)
fetchEvidenceByClaim(claimId) → see proof photos

// Admin
isUserAdmin(userId) → check if admin
sendAdminMessageToClaimant(params) → send message
```

---

## 🔄 Complete Workflow Example

### Student Path:
```
1. Student clicks "Report Found Item"
2. Fills form: title, description, location, photo
3. Clicks "Submit Item"
   ↓ Status: approval_status='pending' (NOT visible to others)
4. Success modal: "Office staff will review your report"
5. Item visible in their profile (view own pending items)
6. Admin approves
   ↓ Status: approval_status='approved'
7. Item NOW shows in public search 🎉
8. Other students can see it
9. Student with matching lost item can claim it
```

### Admin Path:
```
1. Admin goes to /admin
2. Clicks "Pending Approval" tab
3. Sees all pending items (red alert dot)
4. Reviews item: title, description, student info
5. Clicks "Approve" OR "Reject"
   ├─ Approve: Item now public
   └─ Reject: Enters reason, item hidden from public
6. Rejection reason shown to reporter
7. Admin can view all items, claims, cases
```

### Claim Path:
```
1. Student sees found/lost item
2. Clicks "Claim This Item"
3. Fills ownership proof form
4. Uploads photos as evidence
   ↓ claim_case is auto-created
   ↓ status='pending'
5. Admin reviews claim in "Review Center"
6. Admin can:
   ├─ Approve → status='approved'
   ├─ Reject → status='rejected'
   ├─ Request More Info → status='needs_info'
   ├─ Mark Ready for Pickup → status='pickup_scheduled'
   └─ Mark Returned → status='closed'
7. All actions logged in claim_case_events (audit trail)
```

---

## 🛠️ Common Tasks

### Make User Admin:
```sql
UPDATE profiles SET is_admin = true
WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@school.com');
```

### View All Pending Items:
```sql
SELECT * FROM lost_items WHERE approval_status = 'pending' ORDER BY created_at DESC;
```

### View All Claims for an Item:
```sql
SELECT cr.* FROM claim_requests cr
WHERE cr.item_id = 'item-uuid';
```

### View Audit Trail for a Claim:
```sql
SELECT * FROM claim_case_events
WHERE claim_case_id = (SELECT id FROM claim_cases WHERE claim_request_id = 'claim-uuid')
ORDER BY created_at DESC;
```

### Search Items:
```typescript
const results = await searchItems('blue jacket');
// Finds items with 'blue' or 'jacket' in title/description/location
```

---

## 📝 Migration Checklist

- [x] Created `COMPLETE_SETUP.sql` with all tables & RLS
- [x] Updated `AdminPage.tsx` for item approval workflow
- [x] Updated `ReportPage.tsx` to set `approvalStatus: 'pending'`
- [x] Updated types with approval fields
- [x] Updated API mapping functions
- [x] Created success modal messages
- [x] All API functions already exist

## ✅ What Works Now

✅ Students submit items (start as pending, not visible)
✅ Admins approve/reject items in dashboard
✅ Approved items visible to public
✅ Claim cases track entire workflow
✅ Audit logs track all admin actions
✅ RLS security policies enforce access
✅ Evidence uploads work
✅ Admin messages to claimants

---

## 🚀 Deploy Steps

1. **Backup Current Database** (optional but smart)
2. **Run `COMPLETE_SETUP.sql` in Supabase**
   - All tables created
   - RLS set up
   - Functions ready
3. **Restart Frontend**
4. **Test:**
   - Student submits item → pending ✅
   - Admin approves → visible ✅
   - Admin rejects → hidden ✅
   - Claim workflow → works ✅

---

## 🐛 Debug Checklist

```sql
-- Check all items exist
SELECT COUNT(*) FROM lost_items;

-- Check approval workflow
SELECT id, title, approval_status, approved_at FROM lost_items ORDER BY created_at DESC LIMIT 5;

-- Check claims
SELECT COUNT(*) FROM claim_requests;

-- Check claim cases
SELECT COUNT(*) FROM claim_cases;

-- Check if user is admin
SELECT is_admin FROM profiles WHERE id = 'user-uuid';

-- Check audit logs
SELECT * FROM admin_action_logs ORDER BY created_at DESC LIMIT 10;
```

---

## 📞 Next Steps

1. **Run `COMPLETE_SETUP.sql`**
2. **Test student submission** (should be pending)
3. **Go to `/admin`** (should show pending items)
4. **Click Approve** (item should appear in search)
5. **Done!**

If anything breaks, all code is in:
- SQL: `COMPLETE_SETUP.sql`
- Frontend: `src/pages/AdminPage.tsx`
- Types: `src/types/index.ts`
- API: `src/lib/api.ts` (already working)

