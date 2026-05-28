// Create a Supabase Auth user and promote it to admin in public.profiles.
// Usage:
//   node create_admin_user.js --email admin@local.test --password 'Admin123!DirectRoute' --username 'Admin Dummy'
//
// Requires backend/.env:
//   SUPABASE_URL=...
//   SUPABASE_SERVICE_ROLE_KEY=...
//
// Note: Do NOT expose the service role key to the frontend.

const axios = require('axios');
require('dotenv').config();

const parseArgs = () => {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (!a.startsWith('--')) continue;
    const key = a.slice(2);
    const value = args[i + 1] && !args[i + 1].startsWith('--') ? args[++i] : 'true';
    out[key] = value;
  }
  return out;
};

const must = (name, value) => {
  if (!value) throw new Error(`Missing ${name}`);
  return value;
};

const main = async () => {
  const args = parseArgs();

  const supabaseUrl = must('SUPABASE_URL', process.env.SUPABASE_URL);
  const serviceKey = must('SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY);

  const email = must('--email', args.email);
  const password = must('--password', args.password);
  const username = args.username || 'Admin';

  // 1) Create Auth user via Admin API
  const authAdminUrl = `${supabaseUrl.replace(/\\/$/, '')}/auth/v1/admin/users`;
  const createRes = await axios.post(
    authAdminUrl,
    {
      email,
      password,
      email_confirm: true,
      user_metadata: {
        username,
        // prevent self-assigning admin via metadata; profiles.role is set below anyway
        role: 'buyer'
      }
    },
    {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json'
      }
    }
  );

  const userId = createRes.data?.id;
  if (!userId) {
    throw new Error(`Failed to create user (no id). Response: ${JSON.stringify(createRes.data)}`);
  }

  // 2) Upsert public.profiles role=admin via PostgREST (service role bypasses RLS)
  const profilesUrl = `${supabaseUrl.replace(/\\/$/, '')}/rest/v1/profiles?on_conflict=id`;
  await axios.post(
    profilesUrl,
    [{ id: userId, username, role: 'admin', location: '' }],
    {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=representation'
      }
    }
  );

  console.log(`OK: created admin user`);
  console.log(`- email: ${email}`);
  console.log(`- user_id: ${userId}`);
};

main().catch((err) => {
  const msg = err?.response?.data ? JSON.stringify(err.response.data) : err?.message || String(err);
  console.error(`ERROR: ${msg}`);
  process.exit(1);
});

