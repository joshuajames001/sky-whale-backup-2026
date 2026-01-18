
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Load .env manuall
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '..', '.env');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseKey = envConfig.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function debug() {
  const bookId = '7a560443-ac53-45bc-9785-87520391211a'; // Tajemství hvězd
  
  console.log("🔍 Debugging Hotspots for book:", bookId);

  // Get Pages
  const { data: pages } = await supabase
    .from('discovery_pages')
    .select('id, page_number, content_text')
    .eq('book_id', bookId)
    .in('page_number', [14, 15])
    .order('page_number');

  if (!pages) return console.log("No pages found");

  for (const page of pages) {
      console.log(`\n📄 Page ${page.page_number} (${page.id})`);
      console.log(`   Text preview: ${page.content_text.substring(0, 50)}...`);
      
      const { data: hotspots } = await supabase
        .from('discovery_hotspots')
        .select('*')
        .eq('page_id', page.id);
      
      if (!hotspots || hotspots.length === 0) {
          console.log("   ❌ No Hotspots");
      } else {
          hotspots.forEach(hs => {
              console.log(`   ✅ Hotspot: [${hs.title}] (ID: ${hs.id})`);
          });
      }
  }
}

debug();
