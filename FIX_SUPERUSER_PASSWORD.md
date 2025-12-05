# Fix Superuser Password - Quick Guide

## 🔍 Problem

You're getting "Invalid username or password" because the `password_hash` field in the `users` table is not set.

## ✅ Solution Options

### Option 1: Use the API Endpoint (Easiest)

1. **Make sure your dev server is running:**
   ```bash
   npm run dev
   ```

2. **Open a new terminal** and run:
   ```bash
   curl -X POST http://localhost:3000/api/admin/set-password \
     -H "Content-Type: application/json" \
     -d '{"username":"superuser","password":"YourPassword123!"}'
   ```

   Or use PowerShell:
   ```powershell
   Invoke-RestMethod -Uri "http://localhost:3000/api/admin/set-password" `
     -Method POST `
     -ContentType "application/json" `
     -Body '{"username":"superuser","password":"YourPassword123!"}'
   ```

3. **You should see**: `{"success":true,"message":"Password set for user 'superuser'"}`

4. **Now try logging in** with:
   - Username: `superuser`
   - Password: `YourPassword123!`

### Option 2: Use Node.js Script

1. **Install bcryptjs** (if not already installed):
   ```bash
   npm install bcryptjs
   ```

2. **Run the script:**
   ```bash
   node scripts/set-password.js superuser YourPassword123!
   ```

3. **You should see**: Success messages

4. **Try logging in** with the password you set

### Option 3: Manual SQL (If Supabase has pgcrypto)

**Note**: This only works if Supabase has the `pgcrypto` extension enabled.

1. **Go to Supabase Dashboard** → **SQL Editor**

2. **Run this query** (replace `YourPassword123!` with your actual password):
   ```sql
   -- First, check if pgcrypto is available
   CREATE EXTENSION IF NOT EXISTS pgcrypto;
   
   -- Update password hash for superuser
   UPDATE users 
   SET password_hash = crypt('YourPassword123!', gen_salt('bf', 10))
   WHERE username = 'superuser';
   ```

   **⚠️ Note**: This uses PostgreSQL's `crypt()` function which is different from bcrypt. If this doesn't work, use Option 1 or 2.

### Option 4: Check Current State

First, verify what's in your database:

```sql
-- Check if user exists and what password_hash looks like
SELECT id, username, email, role, 
       CASE 
         WHEN password_hash IS NULL THEN 'NULL'
         WHEN password_hash = '' THEN 'EMPTY'
         ELSE 'SET (' || LENGTH(password_hash) || ' chars)'
       END as password_status
FROM users 
WHERE username = 'superuser';
```

## 🔧 Troubleshooting

### If API endpoint returns 404:
- Make sure dev server is running
- Check the URL is correct: `http://localhost:3000/api/admin/set-password`

### If script fails:
- Check `.env.local` has `SUPABASE_SERVICE_ROLE_KEY`
- Verify `bcryptjs` is installed: `npm install bcryptjs`

### If login still fails after setting password:
1. **Check server logs** for detailed error messages
2. **Verify user exists:**
   ```sql
   SELECT * FROM users WHERE username = 'superuser';
   ```
3. **Verify password_hash is set:**
   ```sql
   SELECT username, 
          password_hash IS NOT NULL as has_password,
          active
   FROM users 
   WHERE username = 'superuser';
   ```
4. **Check browser console** for client-side errors

## ✅ Verification

After setting the password, verify it works:

1. **Check password hash is set:**
   ```sql
   SELECT username, 
          LENGTH(password_hash) as hash_length,
          active
   FROM users 
   WHERE username = 'superuser';
   ```
   Should show a hash_length > 0

2. **Try logging in** at `http://localhost:3000`

3. **Check server logs** - you should see successful login messages

## 🎯 Recommended Approach

**Use Option 1 (API Endpoint)** - it's the easiest and handles both the password hash and Supabase Auth user creation/update automatically.





