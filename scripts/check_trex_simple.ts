
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function checkTRexSimple() {
  console.log('--- Checking T-Rex Details (Simple) ---');

  // Fetch only necessary columns for the specific book
  const { data, error } = await supabase
    .from('discovery_books')
    .select('id, title, cover_url')
    .ilike('title', '%rex%')
    .limit(1);

  if (error) {
    console.error('Error fetching T-Rex:', error);
  } else if (data && data.length > 0) {
    console.log('T-Rex Book:', data[0]);
  } else {
    console.log('No T-Rex book found.');
  }
}

checkTRexSimple();
