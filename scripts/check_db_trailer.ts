
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function checkTrailer() {
  const categoryId = '75adc9f6-53e5-44b6-853d-ab77e982f2a2'; // Dinos
  
  const { data: books } = await supabase
    .from('discovery_books')
    .select('id, title, trailer_url')
    .eq('category_id', categoryId);

  console.log('Books in Dinos:', books);
}

checkTrailer();
