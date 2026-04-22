# Supabase Setup Guide

This guide will help you connect your Lost & Found application to Supabase.

## Prerequisites

- A Supabase account (sign up at [supabase.com](https://supabase.com))
- A Supabase project created

## Step 1: Set Up Database Tables

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** (in the left sidebar)
3. Open the file `supabase-schema.sql` in this project
4. Copy the entire contents of that file
5. Paste it into the SQL Editor
6. Click **Run** to execute the SQL

This will create:
- `lost_items` table - stores all found items
- `claim_requests` table - stores claim requests for items
- Row Level Security (RLS) policies
- Indexes for performance
- Helper functions and triggers

## Step 2: Configure Authentication

1. In your Supabase dashboard, go to **Authentication** > **Settings**
2. Under **Auth Providers**, ensure **Email** is enabled
3. (Optional) Configure email templates under **Email Templates**
4. (Optional) Set up email confirmation if desired

## Step 3: Get Your API Keys

1. In your Supabase dashboard, go to **Settings** > **API**
2. Copy the following values:
   - **Project URL** (this is your `VITE_SUPABASE_URL`)
   - **anon/public key** (this is your `VITE_SUPABASE_ANON_KEY`)

## Step 4: Set Environment Variables

1. Create a `.env` file in the root of your project (if it doesn't exist)
2. Add the following variables:

```env
VITE_SUPABASE_URL=your-project-url-here
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Example:**
```env
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **Important:** Never commit your `.env` file to version control. Make sure `.env` is in your `.gitignore` file.

## Step 5: Test the Application

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Test the following:
   - **Browse Items**: Visit `/search` - should show items from Supabase
   - **Report Item**: Visit `/report` - should create items in Supabase
   - **Sign Up**: Visit `/login` - create a new account
   - **Sign In**: Log in with your account
   - **Admin Dashboard**: Visit `/admin` - should be protected (requires login)

## Troubleshooting

### Database Connection Issues

- **Error: "Invalid API key"**
  - Double-check your `VITE_SUPABASE_ANON_KEY` in `.env`
  - Make sure there are no extra spaces or quotes

- **Error: "relation does not exist"**
  - Make sure you ran the SQL schema file (`supabase-schema.sql`)
  - Check that tables were created in the **Table Editor** in Supabase dashboard

### Authentication Issues

- **Can't sign up/login**
  - Check that Email provider is enabled in Authentication settings
  - Verify your email confirmation settings
  - Check browser console for specific error messages

- **Admin page redirects to login**
  - This is expected! You need to be authenticated to access admin features
  - Sign up or sign in first

### Data Not Showing

- **Items not appearing**
  - Check Supabase **Table Editor** to see if data exists
  - Check browser console for API errors
  - Verify RLS policies allow reading (they should by default)

## Database Schema Reference

### `lost_items` Table
- `id` (UUID) - Primary key
- `title` (TEXT) - Item title
- `description` (TEXT) - Item description
- `category` (TEXT) - Item category (electronics, clothing, etc.)
- `location` (TEXT) - Where item was found
- `date_found` (DATE) - Date item was found
- `status` (TEXT) - Item status (found, claimed, returned, expired)
- `image_url` (TEXT, nullable) - URL to item image
- `contact_email` (TEXT, nullable) - Contact email
- `claimed_by` (TEXT, nullable) - Name of person who claimed
- `claimed_at` (TIMESTAMPTZ, nullable) - When item was claimed
- `created_at` (TIMESTAMPTZ) - When record was created
- `updated_at` (TIMESTAMPTZ) - When record was last updated

### `claim_requests` Table
- `id` (UUID) - Primary key
- `item_id` (UUID) - Foreign key to lost_items
- `claimant_name` (TEXT) - Name of person claiming
- `claimant_email` (TEXT) - Email of claimant
- `claimant_phone` (TEXT, nullable) - Phone of claimant
- `proof_description` (TEXT) - Proof of ownership description
- `status` (TEXT) - Request status (pending, approved, rejected)
- `submitted_at` (TIMESTAMPTZ) - When claim was submitted
- `reviewed_at` (TIMESTAMPTZ, nullable) - When claim was reviewed

## Security Notes

- The RLS policies allow:
  - **Anyone** to read (view) items and claims
  - **Anyone** to create claim requests
  - **Authenticated users only** to create/update/delete items
  - **Authenticated users only** to update/delete claims

- If you need stricter security, modify the RLS policies in Supabase dashboard under **Authentication** > **Policies**

## Next Steps

- Customize email templates in Supabase
- Set up storage buckets if you want to upload images directly to Supabase
- Configure additional auth providers (Google, GitHub, etc.)
- Add more sophisticated RLS policies if needed

