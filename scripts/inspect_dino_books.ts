
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function inspectDinoBooks() {
  const categoryId = '75adc9f6-53e5-44b6-853d-ab77e982f2a2'; // Dinos
  
  console.log('--- Inspecting Dino Books (Category: ' + categoryId + ') ---');
  
  const { data: books, error } = await supabase
    .from('discovery_books')
    .select('id, title, trailer_url')
    .eq('category_id', categoryId);

  if (error) {
      console.error('Error fetching books:', error);
      return;
  }

  if (books) {
      books.forEach(b => {
          console.log(`[${b.title}] (ID: ${b.id})`);
          console.log(`   Trailer URL: ${b.trailer_url}`);
      });
  } else {
      console.log('No books found.');
  }
}

inspectDinoBooks();
