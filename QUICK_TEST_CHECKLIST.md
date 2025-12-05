# Quick Test Checklist

## ⚡ Before You Start Testing

### 1. Verify Environment ✅
```bash
# Check .env.local exists and has values
Get-Content .env.local
```

**Required**:
- ✅ NEXT_PUBLIC_SUPABASE_URL
- ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY  
- ✅ SUPABASE_SERVICE_ROLE_KEY
- ✅ NEXT_PUBLIC_SITE_URL

### 2. Verify Database ✅
**In Supabase Dashboard**:
- [ ] Go to Table Editor
- [ ] Verify these tables exist:
  - `users`
  - `tapeheads_submissions`
  - `tapehead_reviews`
  - `pregger_reports`
  - `gantry_reports`
  - `films_reports`
  - `graphics_tasks`
  - `qc_inspections`
  - `jobs`
  - `sail_status`

### 3. Verify User ✅
**In Supabase Dashboard**:
- [ ] Authentication → Users → Your user exists
- [ ] Table Editor → `users` → Your user exists
- [ ] `role` = "superuser" (or your role)
- [ ] `active` = true

### 4. Verify Server ✅
```bash
npm run dev
```
- [ ] Server starts without errors
- [ ] Shows "Ready" message
- [ ] Shows port number (3000 or 3001)

## 🧪 Test Sequence (5 Minutes)

### Test 1: Login Page (30 seconds)
1. Open: http://localhost:3001
2. ✅ Should see login page
3. ✅ No errors in console (F12)

### Test 2: Login (1 minute)
1. Enter email and password
2. Click "Sign In"
3. ✅ Should redirect to dashboard
4. ✅ No errors in console

### Test 3: Dashboard (1 minute)
1. ✅ Dashboard loads
2. ✅ Shows KPIs (even if 0)
3. ✅ No errors in console
4. ✅ Sidebar shows your username/role

### Test 4: API Check (1 minute)
1. Open DevTools → Network tab
2. ✅ See `/api/auth/session` → 200
3. ✅ See `/api/tapeheads` → 200
4. ✅ See other API calls → 200

### Test 5: Create Test Data (1.5 minutes)
1. Try creating a submission (if form ready)
2. OR use API in console (see guide)
3. ✅ Data appears in Supabase Dashboard

## ✅ Success Criteria

**Everything works if**:
- ✅ Can log in
- ✅ Dashboard loads
- ✅ No red errors in console
- ✅ API endpoints return 200
- ✅ Can see your username/role

## ❌ If Something Fails

**Share**:
1. What test failed (1-5)
2. Error message (from console or screen)
3. What you see (blank page, error message, etc.)

---

**Ready? Start with Test 1!** 🚀











