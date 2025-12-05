# Test Login - Step by Step Fix

## 🎯 Let's Fix This Together - 5 Minutes

### Step 1: Check Your User Status

**Make sure your dev server is running** (`npm run dev`), then open a browser and go to:

```
http://localhost:3000/api/admin/debug-user?username=superuser&testPassword=Nahipata@321
```

**This will show you:**
- ✅ If user exists in database
- ✅ If password_hash is set
- ✅ If password matches
- ✅ If auth user exists
- ✅ What the exact problem is

**Copy the JSON response** and share it with me.

### Step 2: Check Server Logs

1. **Look at your terminal** where `npm run dev` is running
2. **Try to log in** with username `superuser` and password `Nahipata@321`
3. **Copy any error messages** you see in the terminal

### Step 3: Quick Fixes Based on Debug Output

#### If `hasPasswordHash: false`:
```powershell
# Set the password
Invoke-RestMethod -Uri "http://localhost:3000/api/admin/set-password" -Method POST -ContentType "application/json" -Body '{"username":"superuser","password":"Nahipata@321"}'
```

#### If `passwordMatches: false`:
The password hash doesn't match. Re-run the set-password command above.

#### If `authUser: null`:
The auth user doesn't exist. The login endpoint will create it automatically, but if it fails, we'll fix it.

#### If `databaseUser: null`:
User doesn't exist in database. You need to create it first.

## 🔧 Manual Database Check

Run this in **Supabase SQL Editor**:

```sql
SELECT 
  username,
  email,
  role,
  active,
  CASE 
    WHEN password_hash IS NULL THEN 'NULL'
    WHEN password_hash = '' THEN 'EMPTY'
    ELSE 'SET (' || LENGTH(password_hash) || ' chars)'
  END as password_status
FROM users 
WHERE username = 'superuser';
```

**Expected result:**
- `username`: `superuser`
- `active`: `true`
- `password_status`: `SET (60 chars)` ← This is critical!

## 🚀 Complete Reset (If Nothing Works)

If you want to start fresh:

1. **Delete the user:**
   ```sql
   DELETE FROM users WHERE username = 'superuser';
   ```

2. **Create user via API** (after server is running):
   ```powershell
   # This will create user with proper password hash
   Invoke-RestMethod -Uri "http://localhost:3000/api/admin/set-password" -Method POST -ContentType "application/json" -Body '{"username":"superuser","password":"Nahipata@321"}'
   ```
   
   **Wait!** This won't work if user doesn't exist. Let me create a better endpoint...

## 📞 What I Need From You

1. **Run the debug endpoint** and share the JSON response
2. **Share any error messages** from server logs
3. **Share the SQL query result** from Step 3

With this info, I can give you the exact fix!





