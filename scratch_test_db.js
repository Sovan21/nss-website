const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load env variables
dotenv.config({ path: path.join(__dirname, '.env.local') });

const supabaseUrl = 'https://nfmgklkenucufkqlsohu.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY is not set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTables() {
  try {
    console.log('Checking unique_visitors count...');
    const { data: visitors, error: vError, count: vCount } = await supabase
      .from('unique_visitors')
      .select('*', { count: 'exact' });
    
    if (vError) {
      console.error('Error fetching unique_visitors:', vError.message);
    } else {
      console.log(`Total rows in unique_visitors: ${vCount}`);
      console.log('Sample visitors:', visitors.slice(0, 5));
    }

    console.log('\nChecking visitor_sessions count...');
    const { data: sessions, error: sError, count: sCount } = await supabase
      .from('visitor_sessions')
      .select('*', { count: 'exact' });

    if (sError) {
      console.error('Error fetching visitor_sessions:', sError.message);
    } else {
      console.log(`Total rows in visitor_sessions: ${sCount}`);
      console.log('Sample sessions:', sessions.slice(0, 5));
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

checkTables();
