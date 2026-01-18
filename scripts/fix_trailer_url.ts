
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateTrailer() {
  console.log('Updating trailer URL...');
  
  // Find a book in "Dinosauri" category (or just update T-Rex if we know it)
  // We'll search for books with 'tyrannosaurus' in title or similar to be safe, 
  // or just any book in the dino category if we knew the ID. 
  // Given previous logs, we know the category ID is 75adc9f6-53e5-44b6-853d-ab77e982f2a2 (Dinosauři)
  
  const categoryId = '75adc9f6-53e5-44b6-853d-ab77e982f2a2';
  
  // First, clear any old trailer URLs to avoid confusion
  await supabase
    .from('discovery_books')
    .update({ trailer_url: null })
    .eq('category_id', categoryId);

  // set the correct local URL for one book (e.g. T-Rex)
  // We'll pick the first book in that category
  const { data: books } = await supabase
    .from('discovery_books')
    .select('id, title')
    .eq('category_id', categoryId)
    .limit(1);

  if (books && books.length > 0) {
      const book = books[0];
      const { error } = await supabase
        .from('discovery_books')
        .update({ trailer_url: '/discovery/dino-trailer.mp4' })
        .eq('id', book.id);
        
      if (error) console.error('Error updating:', error);
      else console.log(`Updated book "${book.title}" with correct trailer URL: /discovery/dino-trailer.mp4`);
  } else {
      console.error('No books found in Dino category.');
  }
}

updateTrailer();
