const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envPath = path.resolve(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
  console.error('.env not found at', envPath);
  process.exit(2);
}

const content = fs.readFileSync(envPath, 'utf8');
content.split(/\r?\n/).forEach((line) => {
  line = line.trim();
  if (!line || line.startsWith('#')) return;
  const idx = line.indexOf('=');
  if (idx === -1) return;
  const key = line.substring(0, idx);
  let val = line.substring(idx + 1);
  val = val.replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
  process.env[key] = val;
});

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !anonKey) {
  console.error('Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY in .env');
  process.exit(2);
}

const supabase = createClient(url, anonKey);

(async () => {
  try {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    if (error) {
      console.error('Query error:', error);
      process.exit(1);
    }

    if (!data) {
      console.log('No player returned for id=1. Connection succeeded.');
      process.exit(0);
    }

    console.log('Player:', data);
    process.exit(0);
  } catch (e) {
    console.error('Unexpected error:', e);
    process.exit(1);
  }
})();
