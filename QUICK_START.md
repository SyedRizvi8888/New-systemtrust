# Quick Start Guide

## If you see a blank page:

### Step 1: Check Browser Console
1. Open your browser's Developer Tools (F12 or Right-click > Inspect)
2. Go to the **Console** tab
3. Look for any red error messages
4. Share those errors if you need help

### Step 2: Create Environment File
Create a `.env` file in the root directory with:

```env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**To get these values:**
1. Go to your Supabase project dashboard
2. Settings > API
3. Copy "Project URL" → `VITE_SUPABASE_URL`
4. Copy "anon public" key → `VITE_SUPABASE_ANON_KEY`

### Step 3: Restart Dev Server
After creating `.env`:
1. Stop the dev server (Ctrl+C)
2. Run `npm run dev` again
3. Refresh your browser

### Step 4: Run SQL Schema
1. Open `supabase-schema.sql` file
2. Copy ALL the SQL code
3. Go to Supabase Dashboard > SQL Editor
4. Paste and click "Run"

## Common Issues:

**Blank white page:**
- Check browser console for errors
- Make sure `.env` file exists
- Restart dev server after creating `.env`

**"Failed to load items" error:**
- Make sure you ran the SQL schema
- Check that tables exist in Supabase Table Editor

**Authentication errors:**
- Enable Email provider in Supabase Dashboard > Authentication > Settings

