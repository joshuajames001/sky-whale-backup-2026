
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Load .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '..', '.env');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseKey = envConfig.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function findHotspot() {
  console.log("🔍 Searching for T-Rex Page 4 Hotspots...");

  // 1. Find Book
  const { data: books } = await supabase.from('discovery_books').select('id').ilike('title', '%Rex%').limit(1);
  if (!books || books.length === 0) { console.log("❌ Book not found"); return; }
  const bookId = books[0].id;

  // 2. Find Page 4
  const { data: pages } = await supabase.from('discovery_pages').select('id').eq('book_id', bookId).eq('page_number', 4).limit(1);
  if (!pages || pages.length === 0) { console.log("❌ Page 4 not found"); return; }
  const pageId = pages[0].id;

  // 3. Find Hotspots
  const { data: hotspots } = await supabase.from('discovery_hotspots').select('*').eq('page_id', pageId);
  
  if (hotspots && hotspots.length > 0) {
      hotspots.forEach(h => {
          console.log(`\n🎯 Hotspot Found:`);
          console.log(`   ID: ${h.id}`);
          console.log(`   Title: ${h.title}`);
          console.log(`   Current X: ${h.x_pos}%`);
          console.log(`   Current Y: ${h.y_pos}%`);
      });
  } else {
      console.log("❌ No hotspots found on Page 4.");
  }
}

findHotspot();
