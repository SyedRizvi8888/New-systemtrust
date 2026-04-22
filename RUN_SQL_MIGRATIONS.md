# SQL Migration Order - Copy & Paste Guide

## Step-by-Step Instructions

### ⚠️ IMPORTANT
Run these in Supabase SQL Editor **IN THIS EXACT ORDER**. Wait for each one to complete before running the next.

---

## Step 1️⃣: Main Schema (Run FIRST)

📄 File: `supabase-schema.sql`

**Location**: `/New-systemtrust/supabase-schema.sql`

**What it does**: Creates all core tables and functions

**Time**: ~30 seconds

---

## Step 2️⃣: Claim Evidence Support

📄 File: `migrations/002_claim_evidence_support.sql`

**Location**: `/New-systemtrust/migrations/002_claim_evidence_support.sql`

**What it does**: Adds image upload support for claim proof

**Time**: ~10 seconds

---

## Step 3️⃣: Student Identity Fields

📄 File: `migrations/003_student_identity_and_workflow_columns.sql`

**Location**: `/New-systemtrust/migrations/003_student_identity_and_workflow_columns.sql`

**What it does**: Adds student ID and workflow fields

**Time**: ~5 seconds

---

## Step 4️⃣: Admin Restrictions (NEW!)

📄 File: `migrations/004_admin_restriction_updates.sql`

**Location**: `/New-systemtrust/migrations/004_admin_restriction_updates.sql`

**What it does**:
- Prevents admins from claiming
- Adds admin messaging
- Sets up admin features

**Time**: ~10 seconds

---

## Step 5️⃣: Create Your Admin User

**After Step 4 completes**, run this SQL (replace email with yours):

```sql
INSERT INTO admin_users (user_id, email)
SELECT id, email
FROM auth.users
WHERE email = 'your.email@school.edu'
ON CONFLICT (user_id) DO NOTHING;
```

**To verify it worked:**
```sql
SELECT * FROM admin_users;
```

---

## 🧪 Quick Verification

After all steps run, execute these checks:

### Check 1: All tables exist
```sql
SELECT COUNT(*) as table_count FROM information_schema.tables
WHERE table_schema = 'public';
```
Should return: **15 or higher**

### Check 2: Admin messages table exists
```sql
SELECT * FROM information_schema.columns
WHERE table_name = 'admin_messages';
```
Should return: **7 rows** (7 columns)

### Check 3: Your admin user exists
```sql
SELECT * FROM admin_users;
```
Should show your admin email

---

## 🚀 What to Do Next

1. **Exit SQL Editor** in Supabase
2. **Restart your Next.js app**:
   ```bash
   npm run dev
   ```
3. **Sign out and back in** to the app
4. **Verify you see**:
   - Admin Dashboard link in navigation
   - Cannot claim items (button hidden)
   - Admin features work

---

## ✅ Completed!

If all verification checks pass, your database is **fully set up**! 🎉

You can now:
- ✅ Review claims as admin
- ✅ Approve/reject claims
- ✅ Send messages to users
- ✅ Admins can't claim items
- ✅ Full audit trail of actions

---

## ❌ If Something Goes Wrong

### Error: "Function already exists"
→ This is fine! Just continue to next migration

### Error: "Table already exists"
→ This is fine! Just continue to next migration

### Error: "Permission denied"
→ Make sure you're using a Supabase account with SQL access
→ Try running each file separately (paste each into its own query)

### Can't find SQL files?
→ Go to your project folder:
```
/New-systemtrust/
├── supabase-schema.sql
├── migrations/
│   ├── 002_claim_evidence_support.sql
│   ├── 003_student_identity_and_workflow_columns.sql
│   └── 004_admin_restriction_updates.sql
```

---

## 📊 Execution Summary

| Step | File | Status |
|------|------|--------|
| 1 | supabase-schema.sql | ⏳ Run |
| 2 | 002_claim_evidence_support.sql | ⏳ Wait for 1 |
| 3 | 003_student_identity_and_workflow_columns.sql | ⏳ Wait for 2 |
| 4 | 004_admin_restriction_updates.sql | ⏳ Wait for 3 |
| 5 | INSERT admin user | ✅ Run last |

---

## 💡 Pro Tips

- Copy-paste entire file content into Supabase SQL Editor
- Don't worry about "IF NOT EXISTS" statements - they're safe
- Wait for ✅ "Successfully executed" before moving to next
- Keep browser DevTools open to see any errors
- If stuck, try closing and reopening SQL Editor

**You've got this!** 🚀
