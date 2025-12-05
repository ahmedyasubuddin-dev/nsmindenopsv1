# Quick Start Testing Guide

## 🚀 Quick Setup (5 minutes)

### 1. Run Migrations in Supabase

1. Open **Supabase Dashboard** → **SQL Editor**
2. Run each file in order (copy entire file, paste, click Run):

   ✅ **001_initial_schema.sql** → Should see "Success"
   ✅ **002_rls_policies.sql** → Should see "Success"  
   ✅ **003_indexes.sql** → Should see "Success"
   ✅ **004_functions.sql** → Should see "Success"

### 2. Create Superuser Account

**Option A: Via Dashboard (Easiest)**
1. **Authentication** → **Users** → **Add User**
   - Email: `superuser@nsmindenops.com`
   - Password: `YourSecurePassword123!`
   - ✅ Auto Confirm User
2. **Copy the User UID** (long UUID)
3. **Table Editor** → **users** → **Insert row**:
   ```
   id: [paste UID from step 2]
   email: superuser@nsmindenops.com
   username: superuser
   role: superuser
   display_name: Superuser
   active: true
   ```

**Option B: Via API (After server is running)**
- Use the `/admin` page to create users (requires login first)

### 3. Set Password Hash

The password hash needs to be set. The easiest way is to use the API:

1. **Start your dev server**: `npm run dev`
2. **Log in** via the app (if possible) OR
3. **Use the admin API** to create users with proper password hashing

**Note**: For the superuser, you can temporarily set the password hash manually via SQL, but it's better to use the API.

### 4. Test Login

1. Open `http://localhost:3000`
2. Enter:
   - Username: `superuser`
   - Password: `YourSecurePassword123!`
3. Should redirect to `/dashboard`

## ✅ Quick Test Checklist

- [ ] Migrations run without errors
- [ ] Can log in with superuser
- [ ] Can access `/admin` page
- [ ] Can create a new user
- [ ] Can update a user's role
- [ ] Dashboard loads without errors

## 🐛 Common Issues & Quick Fixes

| Issue | Quick Fix |
|-------|-----------|
| "relation does not exist" | Run 001_initial_schema.sql first |
| "policy already exists" | Migration handles this now - safe to re-run |
| "trigger already exists" | Migration handles this now - safe to re-run |
| Login fails | Check user exists in both `auth.users` AND `public.users` |
| Stuck on login page | Clear cookies, check browser console |
| "Forbidden" error | Check user role is exactly `superuser` (lowercase) |

## 📝 Verification Queries

Run these in SQL Editor to verify setup:

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Check your user
SELECT id, username, role, email, active FROM users WHERE username = 'superuser';

-- Check policies exist
SELECT schemaname, tablename, policyname FROM pg_policies 
WHERE schemaname = 'public' ORDER BY tablename, policyname;
```

## 🎯 Next Steps

1. ✅ Test login
2. ✅ Create test users for different roles
3. ✅ Test report forms
4. ✅ Test dashboard
5. ✅ Test admin panel

For detailed testing, see `SUPABASE_MIGRATION_GUIDE.md`





