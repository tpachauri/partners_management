const { createClient } = require('@supabase/supabase-js');

// Debug: Check if env vars are loaded
console.log('Supabase URL:', process.env.SUPABASE_URL ? 'Loaded' : 'MISSING!');
console.log('Supabase Key:', process.env.SUPABASE_KEY ? 'Loaded' : 'MISSING!');
console.log('Supabase Service Key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Loaded' : 'MISSING!');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Anon client (for public/auth operations)
const supabase = createClient(supabaseUrl, supabaseKey);

// Service-role client (bypasses RLS — for admin operations like reading onboarding_data)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

module.exports = supabase;
module.exports.supabaseAdmin = supabaseAdmin;