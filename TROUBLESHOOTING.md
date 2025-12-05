# Troubleshooting - Localhost Not Loading

## Quick Fixes

### 1. Check Server is Running
```bash
# Stop any running servers (Ctrl+C in terminal)
# Then restart:
npm run dev
```

### 2. Check Port
- Server might be on **port 3001** instead of 3000
- Try: http://localhost:3001
- Or: http://localhost:3000

### 3. Check Environment Variables
Make sure `.env.local` exists and has correct values:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xfhalhizmxcxzcwbgbgu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key_here
SUPABASE_SERVICE_ROLE_KEY=your_key_here
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 4. Clear Next.js Cache
```bash
# Stop server (Ctrl+C)
# Delete .next folder
rm -rf .next
# Or on Windows:
Remove-Item -Recurse -Force .next

# Restart
npm run dev
```

### 5. Check Browser Console
- Open browser DevTools (F12)
- Check Console tab for errors
- Check Network tab for failed requests

### 6. Check Terminal for Errors
- Look for red error messages
- Common issues:
  - "Invalid API key" → Check .env.local
  - "Cannot find module" → Run `npm install`
  - "Port already in use" → Kill process on that port

### 7. Verify Supabase Connection
Test if Supabase is accessible:
- Go to: https://xfhalhizmxcxzcwbgbgu.supabase.co
- Should show Supabase status page

### 8. Check Middleware
The middleware might be blocking requests. Try temporarily disabling it:

1. Rename `middleware.ts` to `middleware.ts.bak`
2. Restart server
3. Try accessing localhost
4. If it works, the middleware has an issue

### 9. Check Login Page Route
Make sure the login page exists:
- File: `src/app/login/page.tsx`
- Should be accessible at: `/login`

### 10. Common Issues

**Issue**: "Cannot GET /"
- **Fix**: Check `src/app/page.tsx` exists and exports default component

**Issue**: Blank white page
- **Fix**: Check browser console for React errors
- **Fix**: Check if Supabase provider is wrapping app correctly

**Issue**: Infinite redirect loop
- **Fix**: Check middleware redirect logic
- **Fix**: Make sure login page is excluded from auth check

**Issue**: "Module not found"
- **Fix**: Run `npm install`
- **Fix**: Check imports are correct

## Step-by-Step Debugging

1. **Stop server** (Ctrl+C)
2. **Check .env.local exists** and has correct values
3. **Clear cache**: Delete `.next` folder
4. **Reinstall dependencies**: `npm install`
5. **Restart server**: `npm run dev`
6. **Check terminal** for any errors
7. **Open browser** to http://localhost:3001 (or 3000)
8. **Check browser console** (F12) for errors
9. **Check Network tab** for failed requests

## Still Not Working?

Share:
1. **Terminal output** - What errors do you see?
2. **Browser console errors** - Any red messages?
3. **Network tab** - Any failed requests?
4. **What happens** - Blank page? Error message? Loading forever?













