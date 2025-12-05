# Supabase Backend Integration

This project has been migrated from Firebase to Supabase for better performance and scalability.

## Setup Instructions

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your project URL and API keys from the project settings

### 2. Run Database Migrations

1. In your Supabase dashboard, go to SQL Editor
2. Run the migration files in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls_policies.sql`
   - `supabase/migrations/003_indexes.sql`
   - `supabase/migrations/004_functions.sql`

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_SITE_URL=https://nsmindenops.com
```

### 4. Set Up Authentication

1. In Supabase dashboard, go to Authentication > Users
2. Create your first user with email and password
3. Update the `users` table with the user's role:
   ```sql
   UPDATE users SET role = 'superuser' WHERE email = 'your-email@example.com';
   ```

### 5. Configure Row Level Security

The RLS policies are already set up in the migration files. Make sure they're applied correctly.

## API Routes

All data operations now go through REST API routes:

- `/api/auth/*` - Authentication endpoints
- `/api/tapeheads/*` - Tapeheads submissions
- `/api/reviews/*` - Tapehead reviews
- `/api/pregger/*` - Pregger reports
- `/api/gantry/*` - Gantry reports
- `/api/films/*` - Films reports
- `/api/graphics/*` - Graphics tasks
- `/api/qc/*` - QC inspections
- `/api/jobs/*` - OE Jobs
- `/api/sail-status/*` - Sail status tracking

## Migration Notes

- All Firestore operations have been replaced with Supabase API calls
- Authentication now uses Supabase Auth
- Real-time subscriptions use Supabase Realtime
- Row Level Security (RLS) provides data protection

## Deployment

For production deployment on nsmindenops.com:

1. Set environment variables in your hosting platform
2. Ensure `NEXT_PUBLIC_SITE_URL` is set to `https://nsmindenops.com`
3. Configure CORS in Supabase dashboard if needed
4. Test all API endpoints after deployment

## Troubleshooting

- If you see authentication errors, check that users exist in Supabase Auth
- If RLS policies block access, verify user roles in the `users` table
- Check Supabase logs for detailed error messages













