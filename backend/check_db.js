const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: logs, error } = await supabase
    .from('call_logs')
    .select('*, leads(name, phone, final_status)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching logs:', error);
    return;
  }

  console.log('Total Logs:', logs.length);
  const log2401 = logs.find(l => (l.leads && l.leads.phone.includes('2401')) || (l.phone && l.phone.includes('2401')));
  console.log('Log for 2401:', JSON.stringify(log2401, null, 2));
}

run();
