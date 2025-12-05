# Next Steps After Migrations

## ✅ You've Completed:
1. ✅ Created Supabase project
2. ✅ Got API keys
3. ✅ Ran all database migrations

## 📝 Step 4: Configure Environment Variables

I've created `.env.local` file for you. Now you need to:

1. **Open `.env.local`** in your project root (same folder as `package.json`)

2. **Replace the placeholder values** with your actual Supabase credentials:
   - `NEXT_PUBLIC_SUPABASE_URL` - Your project URL (from Supabase dashboard → Settings → API)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your anon/public key
   - `SUPABASE_SERVICE_ROLE_KEY` - Your service_role key (click "Reveal" to see it)

3. **Example of what it should look like:**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjE2MjM5MDIyLCJleHAiOjE5MzE4MTUwMjJ9.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

## 👤 Step 5: Create Your First User

### Option A: Via Supabase Dashboard (Easiest)

1. **Go to Supabase Dashboard** → **Authentication** → **Users**

2. **Click "Add user"** → **"Create new user"**

3. **Fill in:**
   - **Email**: `admin@nsmindenops.com` (or your email)
   - **Password**: Create a strong password (save it!)
   - **Auto Confirm User**: ✅ Check this box
   - **Send magic link**: Leave unchecked

4. **Click "Create user"**

5. **Note the User UID** (you'll see it in the users list)

### Option B: Via SQL (Alternative)

If you prefer SQL, run this in SQL Editor:

```sql
-- First, create the auth user (you'll need to use Supabase Auth API or dashboard for this)
-- Then update the users table:

UPDATE users 
SET 
  role = 'superuser',
  username = 'admin',
  active = true,
  display_name = 'Admin User'
WHERE email = 'admin@nsmindenops.com';
```

## 🔑 Step 6: Set User Role

After creating the user, you need to set their role:

1. **Go to Supabase Dashboard** → **Table Editor** → **users** table

2. **Find your user** (by email or UID)

3. **Update these fields:**
   - `role` → Set to: `superuser`
   - `username` → Set to: `admin` (or preferred username)
   - `active` → Set to: `true`

4. **Click "Save"**

**OR use SQL:**

```sql
UPDATE users 
SET role = 'superuser', username = 'admin', active = true 
WHERE email = 'your-email@example.com';
```

## 🧪 Step 7: Test the Setup

1. **Start your development server:**
   ```bash
   npm run dev
   ```

2. **Open browser:** `http://localhost:3000`

3. **You should see the login page**

4. **Try logging in with:**
   - **Email**: The email you used when creating the user
   - **Password**: The password you set

5. **If successful:**
   - You'll be redirected to `/dashboard`
   - You should see your username and role in the sidebar

## 🔍 Step 8: Verify Everything Works

### Check Browser Console:
- Open DevTools (F12) → Console tab
- Look for any red errors
- Should see no Supabase connection errors

### Check Terminal:
- Look at the terminal where `npm run dev` is running
- Should see no errors
- Should see "Ready" message

### Test API Endpoint:
1. After logging in, open DevTools → Network tab
2. Navigate to dashboard
3. Look for `/api/auth/session` request
4. Should return 200 status with user data

## ❌ Troubleshooting

### "Invalid API key" error
- ✅ Double-check `.env.local` has correct keys
- ✅ Make sure no extra spaces or quotes
- ✅ Restart dev server: Stop (Ctrl+C) and run `npm run dev` again

### "User not found" or login fails
- ✅ Check user exists in Authentication → Users
- ✅ Check user has row in `users` table
- ✅ Verify `role` is set to `superuser`
- ✅ Make sure email matches exactly

### "RLS policy violation"
- ✅ Verify all 4 migrations ran successfully
- ✅ Check user role is set correctly
- ✅ Try refreshing the page

### Can't see login page
- ✅ Check terminal for errors
- ✅ Verify `.env.local` file exists in root directory
- ✅ Make sure you restarted dev server after creating `.env.local`

## ✅ Success Checklist

- [ ] `.env.local` file created with correct values
- [ ] User created in Supabase Auth
- [ ] User role set to `superuser` in `users` table
- [ ] Dev server starts without errors
- [ ] Login page loads
- [ ] Can log in successfully
- [ ] Redirected to dashboard after login
- [ ] No errors in browser console
- [ ] No errors in terminal

## 🎉 Once Everything Works

You're ready to:
1. Start using the app
2. Create test data
3. Update components to use new Supabase hooks (next phase)

---

**Need help?** Check the error message and let me know what you see!













