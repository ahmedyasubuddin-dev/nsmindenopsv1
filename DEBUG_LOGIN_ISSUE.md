# Debug Login Issue - Step by Step

## 🔍 Let's Find the Exact Problem

### Step 1: Check Your User in Database

Run this in **Supabase SQL Editor**:

```sql
-- Check if user exists and password_hash status
SELECT 
  id,
  username,
  email,
  role,
  active,
  CASE 
    WHEN password_hash IS NULL THEN 'NULL - NEEDS TO BE SET'
    WHEN password_hash = '' THEN 'EMPTY - NEEDS TO BE SET'
    ELSE 'SET (' || LENGTH(password_hash) || ' chars)'
  END as password_status,
  created_at
FROM users 
WHERE username = 'superuser';
```

**What to look for:**
- ✅ User exists: Should see 1 row
- ✅ `active` = `true`
- ✅ `password_status` = "SET (60 chars)" (bcrypt hashes are 60 characters)

### Step 2: Check Server Logs

1. **Start your dev server** with verbose logging:
   ```bash
   npm run dev
   ```

2. **Try to log in** with:
   - Username: `superuser`
   - Password: `Nahipata@321`

3. **Check the terminal** where `npm run dev` is running
   - Look for error messages
   - Copy any error messages you see

### Step 3: Check Browser Console

1. **Open browser DevTools** (F12)
2. **Go to Console tab**
3. **Try to log in**
4. **Copy any red error messages**

### Step 4: Test Password Hash Directly

Run this in **Supabase SQL Editor** to verify the password hash:

```sql
-- Get the password hash for superuser
SELECT username, password_hash 
FROM users 
WHERE username = 'superuser';
```

**Then test if it matches** - I'll create a test endpoint for this.

## 🛠️ Quick Fixes to Try

### Fix 1: Re-run Password Setting

Make sure your dev server is running, then:

```powershell
# Test the API endpoint
Invoke-RestMethod -Uri "http://localhost:3000/api/admin/set-password" -Method POST -ContentType "application/json" -Body '{"username":"superuser","password":"Nahipata@321"}'
```

**Expected response:**
```json
{
  "success": true,
  "message": "Password set for user 'superuser'"
}
```

### Fix 2: Verify Auth User Exists

Run this in **Supabase SQL Editor**:

```sql
-- Check auth.users (this might not work due to RLS, but try)
-- Alternative: Go to Authentication → Users in Dashboard
```

**Or check via Dashboard:**
1. Go to **Authentication** → **Users**
2. Look for a user with email `yasubuddin.ali@northsails.com` or `superuser@nsmindenops.com`
3. If it doesn't exist, that's the problem!

### Fix 3: Create Auth User Manually

If auth user doesn't exist:

1. **Go to**: Authentication → Users → Add User
2. **Fill in**:
   - Email: `superuser@nsmindenops.com`
   - Password: `Nahipata@321`
   - ✅ Auto Confirm User
3. **Click**: Create user
4. **Copy the User UID**

5. **Update your users table** to match:
   ```sql
   UPDATE users 
   SET id = 'PASTE_UID_HERE'
   WHERE username = 'superuser';
   ```

## 🔧 Enhanced Debugging

I'll create a debug endpoint to help us see exactly what's happening.





