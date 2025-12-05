# Supabase Migration Guide - Step by Step

## 📋 Prerequisites

- ✅ Supabase project created
- ✅ API keys copied (URL, anon key, service role key)
- ✅ `.env.local` file configured

## 🗄️ Step 1: Run Database Migrations

### Option A: Fresh Database (No Existing Data)

1. **Go to Supabase Dashboard** → **SQL Editor**
2. **Run migrations in this exact order:**

   **Migration 1: Initial Schema**
   - Click "New query"
   - Copy and paste entire contents of `supabase/migrations/001_initial_schema.sql`
   - Click "Run" (or press Ctrl+Enter)
   - ✅ Should see "Success. No rows returned"

   **Migration 2: RLS Policies**
   - Click "New query"
   - Copy and paste entire contents of `supabase/migrations/002_rls_policies.sql`
   - Click "Run"
   - ✅ Should see "Success. No rows returned"

   **Migration 3: Indexes**
   - Click "New query"
   - Copy and paste entire contents of `supabase/migrations/003_indexes.sql`
   - Click "Run"
   - ✅ Should see "Success. No rows returned"

   **Migration 4: Functions**
   - Click "New query"
   - Copy and paste entire contents of `supabase/migrations/004_functions.sql`
   - Click "Run"
   - ✅ Should see "Success. No rows returned"

### Option B: Database Already Has Tables (Re-running Migrations)

If you've already run some migrations and got errors:

1. **Check what tables exist:**
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_type = 'BASE TABLE';
   ```

2. **If you need to start fresh (⚠️ DELETES ALL DATA):**
   ```sql
   -- Run this ONLY if you want to delete everything
   DROP SCHEMA public CASCADE;
   CREATE SCHEMA public;
   GRANT ALL ON SCHEMA public TO postgres;
   GRANT ALL ON SCHEMA public TO public;
   ```
   Then run all migrations from Option A.

3. **If you want to keep data, just re-run the migrations:**
   - The migrations now use `IF NOT EXISTS` and `DROP IF EXISTS`
   - They should run without errors even if objects already exist

## ✅ Step 2: Verify Database Setup

Run this query to verify all tables were created:

```sql
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns 
   WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

**Expected tables:**
- analytics_snapshots
- films_reports
- gantry_reports
- graphics_tasks
- jobs
- pregger_reports
- qc_inspections
- sail_status
- tapehead_reviews
- tapeheads_submissions
- users

## 👤 Step 3: Create Your First User (Superuser)

You need to create a superuser account to access the admin panel.

### Method 1: Via Supabase Dashboard (Recommended)

1. **Go to**: Authentication → Users → Add User
2. **Fill in**:
   - Email: `superuser@nsmindenops.com` (or your email)
   - Password: (choose a strong password)
   - Auto Confirm User: ✅ Checked
3. **Click**: "Create user"
4. **Copy the User UID** (the long UUID)

5. **Go to**: Table Editor → `users` table
6. **Click**: "Insert row"
7. **Fill in**:
   - `id`: Paste the User UID from step 4
   - `email`: `superuser@nsmindenops.com`
   - `username`: `superuser`
   - `role`: `superuser`
   - `display_name`: `Superuser`
   - `active`: `true`
   - `password_hash`: (leave empty for now - we'll set it via API)
8. **Click**: "Save"

### Method 2: Via SQL (Alternative)

```sql
-- First, create auth user (you'll need to do this via Dashboard or API)
-- Then run this to create the profile:

INSERT INTO users (id, email, username, role, display_name, active)
VALUES (
  'YOUR_AUTH_USER_ID_HERE',  -- Replace with actual UUID from auth.users
  'superuser@nsmindenops.com',
  'superuser',
  'superuser',
  'Superuser',
  true
);
```

### Method 3: Via Application (After Login Works)

Once login is working, you can create users via the `/admin` page.

## 🔐 Step 4: Set Password Hash for Your User

Since we're using username-based auth, you need to set the password hash:

1. **Go to**: SQL Editor
2. **Run this** (replace with your password):
   ```sql
   -- Install bcrypt extension if not available
   -- Note: Supabase may not have bcrypt extension
   -- We'll use the API to create users with proper password hashing
   ```

Actually, **use the API to create users** - it handles password hashing correctly.

## 🧪 Step 5: Test the System

### 5.1 Test Local Development Server

1. **Start the dev server:**
   ```bash
   npm run dev
   ```

2. **Open browser**: `http://localhost:3000`

3. **You should see**: Login page

### 5.2 Test Login

1. **Try to log in** with:
   - Username: `superuser`
   - Password: (the password you set)

2. **Expected behavior**:
   - ✅ Login succeeds
   - ✅ Redirects to `/dashboard`
   - ✅ You see the dashboard

3. **If login fails**:
   - Check browser console for errors
   - Check server logs
   - Verify user exists in both `auth.users` and `public.users`
   - Verify password hash is set correctly

### 5.3 Test User Creation (Admin Panel)

1. **Log in as superuser**
2. **Navigate to**: `/admin`
3. **Click**: "Create User"
4. **Fill in**:
   - Role: Select "Tapehead Operator"
   - Password: `test123456`
   - Email: (optional)
5. **Click**: "Create"
6. **Expected**: User appears in the list

### 5.4 Test Role Update

1. **In admin panel**, click edit icon on a user
2. **Change role** to a different one
3. **Click**: "Update Role"
4. **Expected**: Role updates and list refreshes

### 5.5 Test Data Operations

1. **Navigate to**: `/report/tapeheads`
2. **Try to create a submission**
3. **Expected**: Submission is saved
4. **Navigate to**: `/dashboard`
5. **Expected**: See the new submission in the activity feed

## 🐛 Troubleshooting

### Error: "relation does not exist"
- **Solution**: Run migration 001_initial_schema.sql first

### Error: "policy already exists"
- **Solution**: The migration now handles this with `DROP POLICY IF EXISTS`

### Error: "trigger already exists"
- **Solution**: The migration now handles this with `DROP TRIGGER IF EXISTS`

### Error: "function already exists"
- **Solution**: The migration uses `CREATE OR REPLACE FUNCTION`

### Login fails with "Invalid username or password"
- **Check**: User exists in `public.users` table
- **Check**: `password_hash` is set (not null)
- **Check**: Username matches exactly (case-sensitive)
- **Check**: User is `active = true`

### Login succeeds but stuck on login page
- **Check**: Browser console for errors
- **Check**: Session cookies are being set
- **Check**: Middleware is allowing the route
- **Solution**: Clear browser cookies and try again

### "Forbidden - Superuser access required"
- **Check**: Your user's role is exactly `superuser` (lowercase)
- **Check**: User exists in `public.users` table with correct role

## 📊 Verify Database State

Run this query to see all your data:

```sql
-- Check users
SELECT id, username, role, email, active FROM users;

-- Check if tables have data
SELECT 
  'users' as table_name, COUNT(*) as row_count FROM users
UNION ALL
SELECT 'tapeheads_submissions', COUNT(*) FROM tapeheads_submissions
UNION ALL
SELECT 'tapehead_reviews', COUNT(*) FROM tapehead_reviews
UNION ALL
SELECT 'pregger_reports', COUNT(*) FROM pregger_reports
UNION ALL
SELECT 'gantry_reports', COUNT(*) FROM gantry_reports
UNION ALL
SELECT 'films_reports', COUNT(*) FROM films_reports
UNION ALL
SELECT 'graphics_tasks', COUNT(*) FROM graphics_tasks
UNION ALL
SELECT 'qc_inspections', COUNT(*) FROM qc_inspections
UNION ALL
SELECT 'jobs', COUNT(*) FROM jobs
UNION ALL
SELECT 'sail_status', COUNT(*) FROM sail_status;
```

## ✅ Success Checklist

- [ ] All 4 migrations run without errors
- [ ] All 11 tables exist
- [ ] Can log in with superuser account
- [ ] Can access `/admin` page
- [ ] Can create a new user
- [ ] Can update a user's role
- [ ] Can create a tapeheads submission
- [ ] Dashboard shows data
- [ ] No console errors in browser
- [ ] No errors in server logs

## 🚀 Next Steps After Testing

1. **Create additional users** for different roles
2. **Test all report forms** (Pregger, Gantry, Films, Graphics, QC)
3. **Test analytics pages**
4. **Test review and approval workflows**
5. **Deploy to production** (nsmindenops.com)

## 📞 Need Help?

If you encounter errors:
1. Copy the exact error message
2. Note which migration file you were running
3. Check the Supabase logs in Dashboard → Logs
4. Share the error details for troubleshooting





