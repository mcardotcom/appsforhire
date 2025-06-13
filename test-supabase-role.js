const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Loaded' : 'NOT LOADED');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error('Service role key test failed:', error);
  } else {
    console.log('Service role key works! User count:', data.users.length);
  }
}

test(); 