
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function checkTRex() {
  console.log('--- Checking T-Rex Book Details ---');

  const { data: books, error } = await supabase
    .from('discovery_books')
    .select('*')
    .ilike('title', '%rex%');

  if (error) {
    console.error('Error:', error);
    return;
  }

  books.forEach(async (b) => {
      console.log(`Title: ${b.title}`);
      console.log(`ID: ${b.id}`);
      
      const { data: pages } = await supabase
        .from('discovery_pages')
        .select('*')
        .eq('book_id', b.id)
        .order('page_number', { ascending: true });

      if (pages) {
          pages.forEach(async (p) => {
              if (p.page_number === 11 || p.page_number === 10) { 
                  console.log(`Page Number: ${p.page_number} (ID: ${p.id})`);
                  
                  // Fetch real hotspots
                  const { data: hotspots } = await supabase
                    .from('discovery_hotspots')
                    .select('*')
                    .eq('page_id', p.id);
                  
                  console.log(`Active Hotspots: ${JSON.stringify(hotspots, null, 2)}`);
              }
          });
      }
      console.log('---');
  });
}

checkTRex();
