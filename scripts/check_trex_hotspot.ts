
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '..', '.env');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const supabase = createClient(envConfig.VITE_SUPABASE_URL, envConfig.VITE_SUPABASE_ANON_KEY);

async function checkHotspot() {
  console.log("🔍 Checking T-Rex Page 4 Hotspots...");
  
  // Get Page ID for T-Rex Page 4
  const { data: pages } = await supabase
    .from('discovery_pages')
    .select('id, book:discovery_books!inner(title)')
    .eq('page_number', 4)
    .ilike('book.title', '%Rex%')
    .limit(1);

  if (!pages || pages.length === 0) {
      console.log("❌ T-Rex Page 4 Not Found in DB.");
      return;
  }

  const pageId = pages[0].id; // Access flattened ID
  console.log(`✅ Found Page ID: ${pageId}`);

  const { data: hotspots } = await supabase
    .from('discovery_hotspots')
    .select('id, title, x_pos, y_pos')
    .eq('page_id', pageId);

  hotspots?.forEach(h => {
      console.log(`🎯 Hotspot '${h.title}': X=${h.x_pos}%, Y=${h.y_pos}%`);
  });
}

checkHotspot();
