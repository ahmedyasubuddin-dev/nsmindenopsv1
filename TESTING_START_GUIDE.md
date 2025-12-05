# Testing Start Guide - What to Ensure Before Testing

## ✅ Prerequisites Checklist

### 1. Database Setup ✅
- [ ] All 4 migration files run successfully in Supabase SQL Editor:
  - `001_initial_schema.sql` ✅
  - `002_rls_policies.sql` ✅ (updated with user profile creation)
  - `003_indexes.sql` ✅
  - `004_functions.sql` ✅ (updated sync function)
- [ ] Verify tables exist: Go to Supabase Dashboard → Table Editor
- [ ] Check RLS is enabled: Go to Authentication → Policies

### 2. Environment Variables ✅
- [ ] `.env.local` file exists in project root
- [ ] Contains correct values:
  ```env
  NEXT_PUBLIC_SUPABASE_URL=https://xfhalhizmxcxzcwbgbgu.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  NEXT_PUBLIC_SITE_URL=http://localhost:3000
  ```
- [ ] No extra spaces or quotes
- [ ] All keys are complete (no truncation)

### 3. User Setup ✅
- [ ] User exists in Supabase Auth:
  - Go to Authentication → Users
  - Your user should be listed
  - Should be confirmed (checkmark)
- [ ] User exists in `users` table:
  - Go to Table Editor → `users`
  - Find your user by email
  - Verify `role` is set (e.g., "superuser")
  - Verify `active` is `true`
  - Verify `username` is set

### 4. Server Running ✅
- [ ] Dev server is running: `npm run dev`
- [ ] No errors in terminal
- [ ] Server shows "Ready" message
- [ ] Note the port (3000 or 3001)

## 🧪 Testing Sequence

### Test 1: Basic Connection ✅ (START HERE)

**Goal**: Verify Supabase connection works

1. **Open browser**: http://localhost:3001 (or 3000)
2. **Expected**: Login page appears
3. **Check browser console** (F12 → Console):
   - Should see NO red errors
   - May see some info logs (OK)

**✅ Success**: Login page loads without errors
**❌ Failure**: Check terminal for errors, verify `.env.local` exists

---

### Test 2: Authentication ✅

**Goal**: Verify login works and user profile loads

1. **Enter credentials**:
   - Email: (your email from Supabase)
   - Password: (your password)
2. **Click "Sign In"**
3. **Expected**: 
   - Toast says "Login Successful"
   - Redirects to `/dashboard`
   - No errors in console

**✅ Success**: Redirected to dashboard
**❌ Failure**: 
- "Invalid credentials" → Check email/password in Supabase Auth
- "Error fetching user profile" → Check `users` table has your user
- Stays on login page → Check browser console for errors

---

### Test 3: Dashboard Loading ✅

**Goal**: Verify dashboard loads data from Supabase

1. **After login**, dashboard should load
2. **Check browser console** (F12 → Console):
   - Should see NO red errors
   - May see API requests logged
3. **Check Network tab** (F12 → Network):
   - Look for `/api/auth/session` → Should return 200
   - Look for `/api/tapeheads` → Should return 200 (may be empty array)
   - Look for `/api/films` → Should return 200
   - Look for `/api/gantry` → Should return 200
   - Look for `/api/graphics` → Should return 200
   - Look for `/api/qc` → Should return 200

**✅ Success**: Dashboard loads, shows KPIs (even if 0), all API calls return 200
**❌ Failure**: 
- Blank page → Check console for React errors
- 401 errors → Auth not working
- 500 errors → Check Supabase connection

---

### Test 4: User Profile ✅

**Goal**: Verify user profile is loaded correctly

1. **Check sidebar footer**: Should show your username and role
2. **Check user menu** (top right avatar):
   - Should show your email/username
   - Should show your role
3. **Check browser console**: Should see no profile errors

**✅ Success**: Username and role displayed correctly
**❌ Failure**: Profile not loading → Check `users` table

---

### Test 5: API Endpoints (Manual Test) ✅

**Goal**: Verify API endpoints respond correctly

**Test Session Endpoint**:
```bash
# In browser, open DevTools → Network tab
# Navigate to dashboard
# Look for: /api/auth/session
# Click on it → Response tab
# Should see: { user: {...}, profile: {...} }
```

**Test Data Endpoint**:
```bash
# In browser address bar, try:
http://localhost:3001/api/tapeheads
# Should return: { data: [] } (empty if no data)
# If 401: Not logged in
# If 200: Working!
```

**✅ Success**: All endpoints return 200 with data
**❌ Failure**: Check error message, verify Supabase connection

---

### Test 6: Create Test Data ✅

**Goal**: Verify you can create data

1. **Navigate to**: `/report/tapeheads` (if you have permission)
2. **Try creating a test submission** (if form is ready)
3. **Or use API directly**:
   ```bash
   # In browser console:
   fetch('/api/tapeheads', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       operator_name: 'Test User',
       shift: 1,
       th_number: 'TH-1',
       date: new Date().toISOString().split('T')[0],
       total_meters: 100,
       work_items: [{
         oeNumber: 'TEST001',
         section: '001',
         endOfShiftStatus: 'Completed',
         panelsWorkedOn: ['P1'],
         total_meters: 100,
         total_tapes: 1,
         had_spin_out: false,
         tapes: [{ tapeId: '123', metersProduced: 100, metersWasted: 0 }]
       }]
     })
   }).then(r => r.json()).then(console.log)
   ```
4. **Check Supabase Dashboard** → Table Editor → `tapeheads_submissions`
5. **Verify**: Your test data appears

**✅ Success**: Data created and visible in database
**❌ Failure**: Check RLS policies, verify user has permission

---

### Test 7: User Management (Superuser Only) ✅

**Goal**: Verify admin endpoints work

1. **Navigate to**: `/admin` (if you're superuser)
2. **Check**: Should see user list (or empty if no users)
3. **Try creating a user** (if form is ready):
   - Email: `test@example.com`
   - Password: `test123456`
   - Role: `Tapehead Operator`
4. **Verify**: User appears in list
5. **Check Supabase Dashboard**:
   - Authentication → Users → Should see new user
   - Table Editor → `users` → Should see new user profile

**✅ Success**: Can create and list users
**❌ Failure**: 
- 403 Forbidden → Not superuser, check your role
- Error creating → Check service role key

---

## 🔍 Quick Verification Commands

### Check Environment Variables
```bash
# In terminal (PowerShell):
Get-Content .env.local
# Should show all 4 variables with correct values
```

### Check Server Status
```bash
# Terminal should show:
✓ Ready in Xms
- Local: http://localhost:3001
- Environments: .env.local
```

### Check Supabase Connection
1. Go to: https://xfhalhizmxcxzcwbgbgu.supabase.co
2. Should see Supabase status page (not error)

## 🚨 Common Issues & Quick Fixes

### Issue: "Invalid API key"
**Fix**: 
1. Verify `.env.local` has correct keys
2. Restart dev server (Ctrl+C, then `npm run dev`)

### Issue: "User not found" after login
**Fix**:
1. Check `users` table has your user
2. If not, run this SQL:
   ```sql
   INSERT INTO users (id, email, username, role, active)
   SELECT id, email, split_part(email, '@', 1), 'superuser', true
   FROM auth.users
   WHERE email = 'your-email@example.com'
   ON CONFLICT (id) DO UPDATE SET role = 'superuser';
   ```

### Issue: "RLS policy violation"
**Fix**:
1. Verify all migrations ran
2. Check your role in `users` table
3. Verify RLS policies exist in Supabase Dashboard

### Issue: Dashboard shows loading forever
**Fix**:
1. Check browser console for errors
2. Check Network tab for failed requests
3. Verify API routes are accessible

### Issue: Can't create data
**Fix**:
1. Check user role has permission
2. Verify RLS policies allow INSERT
3. Check browser console for specific error

## 📋 Pre-Testing Checklist

Before you start testing, ensure:

- [ ] ✅ All migrations run successfully
- [ ] ✅ `.env.local` configured correctly
- [ ] ✅ User exists in both Auth and `users` table
- [ ] ✅ User role is set correctly
- [ ] ✅ Dev server running without errors
- [ ] ✅ Browser console shows no errors on login page

## 🎯 Testing Order

1. **Start Simple**: Test login first
2. **Then Dashboard**: Verify data loading
3. **Then API**: Test endpoints manually
4. **Then CRUD**: Test creating data
5. **Then Advanced**: Test AI, complex queries

## 📝 What to Document

While testing, note:
- ✅ What works
- ❌ What doesn't work (with error messages)
- 🔍 Any console errors
- 📊 API response codes
- ⚠️ Any warnings

## 🚀 Ready to Test?

**Start here**: http://localhost:3001

1. **First**: Verify login page loads
2. **Second**: Try logging in
3. **Third**: Check if dashboard loads
4. **Fourth**: Check browser console for errors

**Share results**: Let me know what works and what doesn't!











