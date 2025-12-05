# Fix Missing password_hash Column

## 🔍 Problem

Error: `Could not find the 'password_hash' column of 'users' in the schema cache`

This means the `users` table exists but doesn't have the `password_hash` column.

## ✅ Quick Fix

### Step 1: Add the Column

1. **Go to Supabase Dashboard** → **SQL Editor**
2. **Run this SQL:**

```sql
-- Add password_hash column if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
```

3. **Verify it was added:**
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'password_hash';
```

Should show: `password_hash | text`

### Step 2: Set Your Password

Now run the password setting script again:

```bash
node scripts/set-password.js superuser Nahipata@321
```

Or use the API endpoint (if your server is running):

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/admin/set-password" -Method POST -ContentType "application/json" -Body '{"username":"superuser","password":"Nahipata@321"}'
```

## 🔍 Alternative: Check Your Table Structure

If you want to see what columns your `users` table currently has:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;
```

**Expected columns:**
- id
- email
- username
- display_name
- role
- password_hash ← **This should exist**
- active
- created_at
- updated_at
- last_login_at

## 🚨 If Column Still Doesn't Appear

If the column still doesn't show up after adding it:

1. **Refresh Supabase Dashboard** (hard refresh: Ctrl+F5)
2. **Check RLS policies** - make sure you have access:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'users';
   ```
3. **Try the migration file** instead:
   - Run `supabase/migrations/005_add_password_hash.sql` in SQL Editor

## ✅ After Fixing

Once the column is added and password is set:

1. **Verify password_hash is set:**
   ```sql
   SELECT username, 
          password_hash IS NOT NULL as has_password,
          LENGTH(password_hash) as hash_length
   FROM users 
   WHERE username = 'superuser';
   ```

2. **Try logging in** at `http://localhost:3000`

3. **Should work now!** ✅





