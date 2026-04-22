# School-Ready Lost & Found Implementation

## ✅ COMPLETED
- [x] Types updated: `ItemStatus` now includes `under_review`, `matched`, `archived`
- [x] ClaimRequest statuses: added `needs_info`, `pickup_scheduled`, `closed`
- [x] ReportPage fully enhanced with 6-step flow:
  - Step 1-4: Item details (category, title, location, photo)
  - Step 5: Identity verification (name, student ID, grade)
  - Step 6: Contact info (email, phone, preference)
- [x] Success confirmation modals: context-specific instructions for found/lost reports
- [x] All required fields validated before submission

## 🔧 IN PROGRESS / NOT YET

### 1. ItemDetailPage Claim Form Enhancement
**Location:** `src/pages/ItemDetailPage.tsx`

**Changes needed:**
- Add studentId, grade, preferredContactMethod to claimData state 
- Add form fields matching ReportPage (name, email, phone, student ID, grade, contact method)
- Import SubmissionSuccessModal and display for 'claim' type on success
- Update createClaim call to pass all identity fields

**Template:** Copy student identity/contact fields from ReportPage steps 5-6

---

### 2. API Payload Updates  
**Location:** `src/lib/api.ts`

**Changes needed in `toDbItemPayload`:**
```typescript
const toDbItemPayload = (item: Partial<LostItem>): Partial<DbLostItem> => ({
  // ... existing fields ...
  contact_phone: item.contactPhone,
  student_name: item.studentName,
  student_id: item.studentId,
  grade: item.grade,
  preferred_contact_method: item.preferredContactMethod,
  admin_notes: item.adminNotes,
});
```

**Changes needed in `toDbClaimPayload`:**
```typescript
const toDbClaimPayload = (claim: Partial<ClaimRequest>): Partial<DbClaim> => ({
  // ... existing fields ...
  claimant_student_id: claim.claimantStudentId,
  preferred_contact_method: claim.preferredContactMethod,
  reviewed_by: claim.reviewedBy,
  internal_notes: claim.internalNotes,
  status: claim.status,
});
```

---

### 3. Database Migration
**Location:** `supabase-schema.sql` (add to lost_items table)

```sql
ALTER TABLE lost_items ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE lost_items ADD COLUMN IF NOT EXISTS student_name TEXT;
ALTER TABLE lost_items ADD COLUMN IF NOT EXISTS student_id TEXT;
ALTER TABLE lost_items ADD COLUMN IF NOT EXISTS grade TEXT;
ALTER TABLE lost_items ADD COLUMN IF NOT EXISTS preferred_contact_method TEXT;
ALTER TABLE lost_items ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- For claim_requests table
ALTER TABLE claim_requests ADD COLUMN IF NOT EXISTS claimant_student_id TEXT;
ALTER TABLE claim_requests ADD COLUMN IF NOT EXISTS preferred_contact_method TEXT;
ALTER TABLE claim_requests ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id);
ALTER TABLE claim_requests ADD COLUMN IF NOT EXISTS internal_notes TEXT;
```

---

### 4. AdminPage Full Case Card
**Location:** `src/pages/AdminPage.tsx`

**Replace claim card rendering with:**
```tsx
{/* Full case details card */}
<div className="p-6 rounded-xl border border-border bg-card space-y-6">
  {item && (
    <>
      {/* Item Header */}
      <div className="border-b border-border pb-4">
        <h3 className="text-lg font-bold text-foreground mb-2">
          {item.title}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground">Category</p>
            <p className="font-medium">{categoryLabels[item.category]}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Location</p>
            <p className="font-medium">{item.location}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Date {reportType === 'found' ? 'Found' : 'Lost'}</p>
            <p className="font-medium">{new Date(item.dateFound).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Status</p>
            <p className="font-medium capitalize">{item.status}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Reported</p>
            <p className="font-medium">{new Date(item.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Reporter Details */}
      <div>
        <h4 className="font-semibold text-foreground mb-3">Reporter Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-secondary/50 rounded-lg">
          <div>
            <p className="text-xs text-muted-foreground">Name</p>
            <p className="font-medium text-foreground">{item.studentName || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Student ID</p>
            <p className="font-medium text-foreground">{item.studentId || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Grade</p>
            <p className="font-medium text-foreground">{item.grade || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Email</p>
            <p className="font-medium text-foreground break-all">{item.contactEmail || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Phone</p>
            <p className="font-medium text-foreground">{item.contactPhone || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Preferred Contact</p>
            <p className="font-medium text-foreground capitalize">{item.preferredContactMethod || '-'}</p>
          </div>
        </div>
      </div>

      {/* Claimant Details (if exists) */}
      {claim && (
        <div>
          <h4 className="font-semibold text-foreground mb-3">Claimant Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-secondary/50 rounded-lg">
            <div>
              <p className="text-xs text-muted-foreground">Name</p>
              <p className="font-medium text-foreground">{claim.claimantName}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Student ID</p>
              <p className="font-medium text-foreground">{claim.claimantStudentId || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="font-medium text-foreground break-all">{claim.claimantEmail}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Phone</p>
              <p className="font-medium text-foreground">{claim.claimantPhone || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Claim Status</p>
              <p className="font-medium capitalize">{claim.status}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Submitted</p>
              <p className="font-medium">{new Date(claim.submittedAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      )}

      {/* Evidence */}
      {evidence[claim.id] && evidence[claim.id].length > 0 && (
        // ... existing evidence display code ...
      )}

      {/* Admin Notes */}
      <div>
        <Label className="text-sm font-semibold mb-2 block">Internal Notes</Label>
        <Textarea
          value={item.adminNotes || ''}
          onChange={(e) => {
            setItems(items.map(i => i.id === item.id ? { ...i, adminNotes: e.target.value } : i));
          }}
          placeholder="Add office notes about this report (not visible to student)..."
          className="h-20"
        />
      </div>

      {/* Admin Actions */}
      <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
        <Button variant="outline" size="sm" className="text-success hover:bg-success/10">
          <Check className="h-4 w-4 mr-1" /> Approve Claim
        </Button>
        <Button variant="outline" size="sm" className="text-amber-600 hover:bg-amber-50">
          Request More Info
        </Button>
        <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10">
          <X className="h-4 w-4 mr-1" /> Reject
        </Button>
        <Button variant="outline" size="sm">
          <MessageSquare className="h-4 w-4 mr-1" /> Message
        </Button>
      </div>

      {/* Message Composer */}
      <div>
        <Label className="text-sm font-semibold mb-2 block">Send Message to {reportType === 'found' ? 'Reporter' : 'Claimant'}</Label>
        <Textarea
          value={messageDrafts[claim.id] ?? ''}
          onChange={(e) => setMessageDrafts({ ...messageDrafts, [claim.id]: e.target.value })}
          placeholder="Type a message... e.g., 'Come to the office with your student ID to pick up the item.'"
          className="h-24 mb-2"
        />
        <Button
          size="sm"
          onClick={() => handleSendMessage(claim)}
          disabled={!messageDrafts[claim.id]?.trim()}
          className="bg-green-600 hover:bg-green-700"
        >
          <Send className="h-4 w-4 mr-1" /> Send Message
        </Button>
      </div>
    </>
  )}
</div>
```

---

### 5. Status Workflow Helpers
**New file:** `src/lib/statusWorkflow.ts`

```typescript
import { ItemStatus } from '@/types';

export const itemStatusFlow: Record<ItemStatus, ItemStatus[]> = {
  'found': ['under_review', 'matched', 'returned', 'archived'],
  'lost': ['under_review', 'matched', 'returned', 'archived'],
  'under_review': ['matched', 'archived'],
  'matched': ['returned', 'archived'],
  'returned': ['archived'],
  'archived': [],
};

export const getNextStatus = (current: ItemStatus): ItemStatus[] => {
  return itemStatusFlow[current] || [];
};

export const statusDescriptions: Record<ItemStatus, string> = {
  'found': 'Item reported as found',
  'lost': 'Item reported as lost',
  'under_review': 'Office reviewing possible matches',
  'matched': 'Match found, pending pickup',
  'returned': 'Successfully returned to owner',
  'archived': 'Item archived or expired',
};
```

---

## 📋 Testing Checklist

1. **Student Report Flow**
   - [ ] Create found item report → see success modal with office instructions
   - [ ] Verify all 6 steps work
   - [ ] Confirm student identity fields stored

2. **Claim Submission**
   - [ ] Submit claim with full identity info
   - [ ] See success modal with pickup instructions
   - [ ] Verify evidence photo saves

3. **Admin Dashboard**
   - [ ] View full case details with reporter + claimant info
   - [ ] See all contact methods
   - [ ] Send message to student
   - [ ] Update internal notes
   - [ ] Change claim status

4. **Notifications** (after backend worker setup)
   - [ ] Student receives email on status change
   - [ ] Student asked for more info gets notified
   - [ ] Pickup instructions email sent on approval

---

## 🚀 Deployment Order

1. Updates types (✅ done)
2. Update ReportPage (✅ done)
3. Create SubmissionSuccessModal component (✅ done)
4. Update ItemDetailPage claim form
5. Update AdminPage case cards
6. Run database migration to add columns
7. Update API payloads to include new fields
8. Test end-to-end flow with test accounts
9. Deploy to production
