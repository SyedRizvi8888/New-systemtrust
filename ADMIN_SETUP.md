# Admin Account Setup Guide

## Creating Your First Admin Account

After running the SQL schema, you need to manually create your first admin account.

### Step 1: Sign Up/Login
1. Go to `/login` in your app
2. Sign up or sign in with the email you want to use as admin
3. Copy your user ID from the browser console or Supabase dashboard

### Step 2: Add Admin via SQL

Go to Supabase Dashboard > SQL Editor and run:

```sql
-- Replace 'your-admin-email@example.com' with your actual admin email
INSERT INTO admin_users (user_id, email) 
SELECT id, email 
FROM auth.users 
WHERE email = 'your-admin-email@example.com';
```

### Step 3: Verify Admin Access

1. Refresh your app
2. Go to `/admin` - you should now have access
3. The admin dashboard will show all items and pending claims

## Features Enabled for Admins

- ✅ Access to `/admin` dashboard
- ✅ View all lost items
- ✅ Approve/reject claim requests
- ✅ Manage items (update status, etc.)

## Security Features

- ✅ Users cannot claim items they reported as found
- ✅ Only authenticated users can create items
- ✅ Admin routes are protected
- ✅ Row Level Security (RLS) policies protect data

## Adding More Admins

Once you have one admin, you can add more by:

1. Having them sign up/login
2. Running the SQL query above with their email
3. Or create an admin management UI (future enhancement)

## Notes

- The first admin must be added via SQL
- All subsequent admins can be added the same way
- Admin status is checked via the `admin_users` table
- If the table doesn't exist, it falls back to checking a hardcoded email list

