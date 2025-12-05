/**
 * Utility script to set password hash for a user
 * Run with: node scripts/set-password.js <username> <password>
 */

const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase credentials in .env.local');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function setPassword(username, password) {
  try {
    console.log(`Setting password for user: ${username}`);
    
    // Find user
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (findError || !user) {
      console.error(`Error: User '${username}' not found`);
      process.exit(1);
    }

    console.log(`Found user: ${user.email || user.username}`);

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    console.log('Password hashed successfully');

    // Update user
    const { error: updateError } = await supabase
      .from('users')
      .update({ password_hash: passwordHash })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating password:', updateError);
      process.exit(1);
    }

    console.log('✅ Password updated successfully!');
    console.log(`You can now log in with username: ${username}`);

    // Also update/create auth user
    const authEmail = user.email || `${username}@nsmindenops.com`;
    
    try {
      // Check if auth user exists
      const { data: { users: authUsers } } = await supabase.auth.admin.listUsers();
      const existingAuthUser = authUsers.find(u => 
        u.user_metadata?.username === username || u.email === authEmail
      );

      if (existingAuthUser) {
        // Update existing auth user password
        await supabase.auth.admin.updateUserById(existingAuthUser.id, {
          password: password,
          user_metadata: {
            username: username,
            role: user.role,
          },
        });
        console.log('✅ Supabase Auth user password updated');
      } else {
        // Create new auth user
        await supabase.auth.admin.createUser({
          email: authEmail,
          password: password,
          email_confirm: true,
          user_metadata: {
            username: username,
            role: user.role,
          },
        });
        console.log('✅ Supabase Auth user created');
      }
    } catch (authError) {
      console.warn('⚠️  Warning: Could not update/create auth user:', authError.message);
      console.log('   You can still log in, but session creation might fail');
    }

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Get command line arguments
const username = process.argv[2];
const password = process.argv[3];

if (!username || !password) {
  console.error('Usage: node scripts/set-password.js <username> <password>');
  console.error('Example: node scripts/set-password.js superuser MyPassword123!');
  process.exit(1);
}

setPassword(username, password);





