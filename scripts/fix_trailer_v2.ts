
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

const CATEGORY_ID = '75adc9f6-53e5-44b6-853d-ab77e982f2a2';
const CORRECT_URL = '/discovery/dino-trailer.mp4';

async function fixTrailer() {
  console.log('--- FIXING TRAILER URL (v2) ---');

  // 1. Get all books in category
  const { data: books, error } = await supabase
    .from('discovery_books')
    .select('id, title, trailer_url')
    .eq('category_id', CATEGORY_ID);

  if (error) {
    console.error('Error fetching books:', error);
    return;
  }

  console.log(`Found ${books?.length} books.`);

  if (!books || books.length === 0) return;

  // 2. Identify target book (Tyrannosaurus) and others
  let targetBook = books.find(b => b.title.toLowerCase().includes('tyran') || b.title.toLowerCase().includes('t-rex'));
  
  // If not found, just take the first one
  if (!targetBook) {
      targetBook = books[0];
      console.log('T-Rex not explicitly found, selecting first book:', targetBook.title);
  } else {
      console.log('Target book found:', targetBook.title);
  }

  // 3. Update Target Book
  const { error: updateError } = await supabase
      .from('discovery_books')
      .update({ trailer_url: CORRECT_URL })
      .eq('id', targetBook.id);

  if (updateError) {
      console.error('FAILED to update target book:', updateError);
  } else {
      console.log(`SUCCESS: Updated "${targetBook.title}" to ${CORRECT_URL}`);
  }

  // 4. Clear others (if any have trailers)
  const otherBooks = books.filter(b => b.id !== targetBook!.id && b.trailer_url);
  if (otherBooks.length > 0) {
      console.log(`clearing ${otherBooks.length} other trailers...`);
      for (const b of otherBooks) {
          await supabase.from('discovery_books').update({ trailer_url: null }).eq('id', b.id);
          console.log(`Cleared trailer for: ${b.title}`);
      }
  }
}

fixTrailer();
