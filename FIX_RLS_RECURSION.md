# Fix RLS Infinite Recursion Error

## 🔍 Problem

Error: `infinite recursion detected in policy for relation "users"`

This happens when RLS policies on the `users` table try to query the `users` table itself to check permissions - creating a circular dependency.

## ✅ Solution

The RLS policies have been updated to use a `SECURITY DEFINER` function that bypasses RLS when checking if a user is a superuser.

## 🚀 Quick Fix

### Step 1: Run the Fixed RLS Policies

1. **Go to Supabase Dashboard** → **SQL Editor**
2. **Run this SQL:**

```sql
-- Helper function to check if user is superuser (bypasses RLS)
CREATE OR REPLACE FUNCTION is_superuser(check_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users 
    WHERE id = check_user_id AND role = 'superuser'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Superusers can view all users" ON users;
DROP POLICY IF EXISTS "Superusers can manage all users" ON users;

-- Recreate with fixed policies (using function to avoid recursion)
CREATE POLICY "Superusers can view all users"
  ON users FOR SELECT
  USING (is_superuser(auth.uid()));

CREATE POLICY "Superusers can manage all users"
  ON users FOR ALL
  USING (is_superuser(auth.uid()));
```

### Step 2: Test Login Again

1. **Try logging in** with:
   - Username: `superuser`
   - Password: `Nahipata@321`

2. **Should work now!** ✅

## 🔧 What Changed

**Before (caused recursion):**
```sql
CREATE POLICY "Superusers can view all users"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users  -- ❌ This queries users table while checking users table!
      WHERE id = auth.uid() AND role = 'superuser'
    )
  );
```

**After (no recursion):**
```sql
CREATE POLICY "Superusers can view all users"
  ON users FOR SELECT
  USING (is_superuser(auth.uid()));  -- ✅ Function bypasses RLS
```

The `SECURITY DEFINER` function runs with the privileges of the function creator (postgres), so it bypasses RLS and avoids the recursion.

## ✅ Verification

After running the fix, verify it works:

```sql
-- This should return true for your superuser
SELECT is_superuser('0f7e1952-b6dd-48d5-bd76-082691b3f351');
```

Should return: `true`





