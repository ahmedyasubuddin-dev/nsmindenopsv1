# Step-by-Step Supabase Setup Guide

## Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - **Name**: `nsmindenops` (or your preferred name)
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Start with Free tier
5. Click "Create new project"
6. Wait 2-3 minutes for project to initialize

## Step 2: Get Your API Keys

1. In your Supabase dashboard, go to **Settings** (gear icon) → **API**
2. Copy these values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)
   - **service_role key** (starts with `eyJ...`) - Click "Reveal" to see it

⚠️ **IMPORTANT**: Keep the service_role key secret! Never commit it to git.

## Step 3: Run Database Migrations

1. In Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click "New query"
3. Copy and paste the contents of `supabase/migrations/001_initial_schema.sql`
4. Click "Run" (or press Ctrl+Enter)
5. Wait for success message
6. Repeat for each migration file in order:
   - `001_initial_schema.sql` ✅
   - `002_rls_policies.sql` ✅
   - `003_indexes.sql` ✅
   - `004_functions.sql` ✅

**Verify**: Go to **Table Editor** - you should see all tables created.

## Step 4: Configure Environment Variables

1. In your project root, create `.env.local` file (if it doesn't exist)
2. Add these variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Site URL (update for production)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

3. Replace the placeholder values with your actual Supabase credentials

## Step 5: Create Your First User

### Option A: Via Supabase Dashboard (Recommended for testing)

1. Go to **Authentication** → **Users** in Supabase dashboard
2. Click "Add user" → "Create new user"
3. Enter:
   - **Email**: `admin@nsmindenops.com` (or your email)
   - **Password**: Create a strong password
   - **Auto Confirm User**: ✅ (check this)
4. Click "Create user"
5. Note the User UID (you'll need it)

### Option B: Via Sign Up (if you add signup page later)

Users can sign up, but you'll need to manually assign roles.

## Step 6: Set User Role

1. In Supabase dashboard, go to **Table Editor** → `users` table
2. Find the user you just created (by email or UID)
3. Update the `role` field to: `superuser`
4. Update `username` field to: `admin` (or preferred username)
5. Update `active` to: `true`
6. Click "Save"

**Alternative via SQL**:
```sql
UPDATE users 
SET role = 'superuser', username = 'admin', active = true 
WHERE email = 'admin@nsmindenops.com';
```

## Step 7: Test the Setup

1. **Start your development server**:
   ```bash
   npm run dev
   ```

2. **Open your browser**: `http://localhost:3000`

3. **Test Login**:
   - You should see the login page
   - Try logging in with:
     - Email: `admin@nsmindenops.com` (or the email you used)
     - Password: The password you set
   - If login works, you'll be redirected to dashboard

4. **Check Browser Console**: Look for any errors

5. **Check Terminal**: Look for any server errors

## Step 8: Verify API Routes

Test that your API is working:

1. **Test Session Endpoint** (after logging in):
   - Open browser DevTools → Network tab
   - Navigate to dashboard
   - Look for `/api/auth/session` request
   - Should return 200 with user data

2. **Test Data Endpoint**:
   - Try accessing: `http://localhost:3000/api/tapeheads`
   - Should return empty array `[]` (no data yet) or 401 if not logged in

## Step 9: Common Issues & Fixes

### Issue: "Invalid API key"
- **Fix**: Double-check your `.env.local` file has correct keys
- **Fix**: Restart dev server after changing `.env.local`

### Issue: "User not found" or "Unauthorized"
- **Fix**: Make sure user exists in `auth.users` table
- **Fix**: Make sure user has a corresponding row in `users` table
- **Fix**: Check that `role` is set correctly

### Issue: "RLS policy violation"
- **Fix**: Verify migrations ran successfully
- **Fix**: Check that user role matches RLS policy requirements

### Issue: Login page shows but can't log in
- **Fix**: Check Supabase dashboard → Authentication → Users
- **Fix**: Verify email/password are correct
- **Fix**: Check browser console for errors

## Step 10: Production Deployment

When ready to deploy to nsmindenops.com:

1. **Update environment variables** in your hosting platform:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   NEXT_PUBLIC_SITE_URL=https://nsmindenops.com
   ```

2. **Configure CORS** (if needed):
   - In Supabase dashboard → Settings → API
   - Add `https://nsmindenops.com` to allowed origins

3. **Test production**:
   - Deploy your app
   - Test login
   - Test API endpoints
   - Verify data operations

## Next Steps After Setup

Once basic setup works:

1. ✅ Test authentication flow
2. ✅ Create test data via API
3. ✅ Update components to use new hooks (see component migration guide)
4. ✅ Test all CRUD operations
5. ✅ Migrate existing data (if you have Firebase data to migrate)

## Need Help?

- Check Supabase logs: Dashboard → Logs
- Check browser console for client errors
- Check terminal for server errors
- Review `README_SUPABASE.md` for more details













