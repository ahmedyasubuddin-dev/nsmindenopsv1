# Production Setup Guide - Supabase Connection

## ✅ Step 1: Environment File Created

I've created `.env.local` with your Supabase credentials. The file contains:
- ✅ Your Supabase project URL
- ✅ Your anon/public key
- ✅ Your service_role key
- ✅ Local development URL

## 🔍 Step 2: Verify Database Tables

Let's make sure all your migrations ran successfully:

1. **Go to your Supabase Dashboard**: https://supabase.com/dashboard/project/xfhalhizmxcxzcwbgbgu
2. **Click "Table Editor"** (left sidebar)
3. **Verify you see these tables:**
   - ✅ `users`
   - ✅ `tapeheads_submissions`
   - ✅ `tapehead_reviews`
   - ✅ `pregger_reports`
   - ✅ `gantry_reports`
   - ✅ `films_reports`
   - ✅ `graphics_tasks`
   - ✅ `qc_inspections`
   - ✅ `jobs`
   - ✅ `sail_status`
   - ✅ `analytics_snapshots`

**If any tables are missing**, run the corresponding migration file again in SQL Editor.

## 👤 Step 3: Create Your First Admin User

### Method 1: Via Supabase Dashboard (Recommended)

1. **Go to**: Authentication → Users
2. **Click**: "Add user" → "Create new user"
3. **Fill in:**
   - **Email**: `admin@nsmindenops.com` (or your email)
   - **Password**: Create a strong password (save it!)
   - **Auto Confirm User**: ✅ Check this
4. **Click**: "Create user"
5. **Copy the User UID** (you'll see it in the list)

### Method 2: Set User Role

After creating the user, set their role:

1. **Go to**: Table Editor → `users` table
2. **Find your user** (by email or UID)
3. **Update these fields:**
   - `role` → `superuser`
   - `username` → `admin`
   - `active` → `true`
4. **Click**: "Save"

**OR use SQL** (faster):
```sql
-- Replace 'admin@nsmindenops.com' with the email you used
UPDATE users 
SET 
  role = 'superuser',
  username = 'admin',
  active = true,
  display_name = 'Admin User'
WHERE email = 'admin@nsmindenops.com';
```

## 🧪 Step 4: Test Local Connection

1. **Start your dev server:**
   ```bash
   npm run dev
   ```

2. **Open browser**: `http://localhost:3000`

3. **Test login:**
   - Use the email and password you created
   - You should be redirected to `/dashboard`

4. **Check for errors:**
   - Browser console (F12 → Console)
   - Terminal where `npm run dev` is running

## 🚀 Step 5: Production Configuration

For production on **nsmindenops.com**, you'll need to:

### A. Update Environment Variables in Your Hosting Platform

When deploying, set these environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xfhalhizmxcxzcwbgbgu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmaGFsaGl6bXhjeHpjd2JnYmd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4MDk1NTUsImV4cCI6MjA3ODM4NTU1NX0.x8Hfzb1iMpRBRBUGuNm1tCjRqtD5rPUGAZIOYbYvQgE
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmaGFsaGl6bXhjeHpjd2JnYmd1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjgwOTU1NSwiZXhwIjoyMDc4Mzg1NTU1fQ.fxN_JzrRfqRO85Ew-zzYaS7QrBT8C_wW030luYzdSs0
NEXT_PUBLIC_SITE_URL=https://nsmindenops.com
```

### B. Configure CORS (If Needed)

1. **Go to**: Supabase Dashboard → Settings → API
2. **Scroll to**: "CORS Configuration"
3. **Add**: `https://nsmindenops.com` to allowed origins
4. **Save**

### C. Update .env.local for Production Testing

You can also update your local `.env.local` to test production URL:

```env
NEXT_PUBLIC_SITE_URL=https://nsmindenops.com
```

## ✅ Step 6: Verify Database Operations

Test that your API routes work:

### Test 1: Authentication
```bash
# After logging in, check browser DevTools → Network tab
# Look for: /api/auth/session
# Should return: 200 OK with user data
```

### Test 2: Create Test Data
1. **Log in to your app**
2. **Try creating a test submission** (if you have forms ready)
3. **Check Supabase Dashboard** → Table Editor → `tapeheads_submissions`
4. **Verify data appears**

### Test 3: API Endpoints
You can test directly:
```bash
# Get tapeheads submissions (requires auth)
curl -X GET http://localhost:3000/api/tapeheads \
  -H "Cookie: your-session-cookie"
```

## 🔒 Step 7: Security Checklist

- ✅ `.env.local` is in `.gitignore` (should not be committed)
- ✅ Service role key is kept secret
- ✅ RLS policies are enabled on all tables
- ✅ User roles are properly set
- ✅ CORS is configured for production domain

## 📊 Step 8: Monitor Performance

### Supabase Dashboard Monitoring:
1. **Go to**: Project → Dashboard
2. **Check**:
   - API requests
   - Database size
   - Active connections
   - Error logs

### Check Logs:
1. **Go to**: Logs (left sidebar)
2. **Monitor**:
   - API errors
   - Database errors
   - Auth events

## 🎯 Quick Test Checklist

- [ ] `.env.local` file exists with correct values
- [ ] All database tables exist
- [ ] Admin user created and role set to `superuser`
- [ ] Dev server starts without errors
- [ ] Can log in successfully
- [ ] Dashboard loads after login
- [ ] No errors in browser console
- [ ] No errors in terminal
- [ ] Can create test data (if forms are ready)

## 🚨 Troubleshooting

### "Invalid API key"
- ✅ Restart dev server after creating `.env.local`
- ✅ Check for typos in keys
- ✅ Make sure no extra spaces

### "User not found"
- ✅ Verify user exists in Authentication → Users
- ✅ Check `users` table has corresponding row
- ✅ Verify role is set correctly

### "RLS policy violation"
- ✅ Check all migrations ran successfully
- ✅ Verify user role matches policy requirements
- ✅ Check Supabase logs for details

### Connection issues
- ✅ Check Supabase project is active
- ✅ Verify project URL is correct
- ✅ Check network/firewall settings

## 📝 Next Steps After Setup

Once everything works:

1. ✅ **Test all CRUD operations** - Create, Read, Update, Delete
2. ✅ **Update components** - Migrate from Firebase hooks to Supabase hooks
3. ✅ **Test real-time** - Verify subscriptions work
4. ✅ **Load test** - Test with multiple users
5. ✅ **Deploy to production** - Set environment variables in hosting

## 🎉 Success!

If you can:
- ✅ Log in
- ✅ See dashboard
- ✅ No errors in console/terminal

**Your Supabase backend is connected and ready!** 🚀

---

**Need help?** Check Supabase logs or share the error message you're seeing.













