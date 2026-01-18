-- Seed File for Master Style Library v2026
-- This populates the style_presets table with the 15 validated styles for Flux 2 Pro.

INSERT INTO style_presets (id, name, prompt_en, description) VALUES
('watercolor', 'Akvarel', 'soft watercolor aesthetic, bleeding pigment edges, wet-on-wet technique, visible paper grain, ethereal translucent layers', 'Jemné rozpité barvy, textura akvarelového papíru a snová atmosféra.'),
('pixar_3d', 'Pixar 3D', 'modern 3D animation style, subsurface scattering on skin, soft rim lighting, expressive big-eyed features, cinematic depth of field', 'Moderní filmový vzhled s hloubkou, měkkým svícením a vysokou mírou detailů.'),
('futuristic', 'Futuristický', 'high-tech industrial design, glowing neon accents, clean streamlined surfaces, metallic and carbon fiber textures, ultra-modern sleekness', 'Čisté tvary, high-tech materiály a precizní neonové linky.'),
('sketch', 'Kresba', 'traditional graphite pencil sketch, visible cross-hatching, charcoal smudges, raw hand-drawn lines on textured paper', 'Tradiční styl tužky nebo uhlu s viditelným šrafováním a texturou papíru.'),
('ghibli_anime', 'Studio Ghibli', 'classic hand-painted anime aesthetic, lush gouache landscapes, soft natural sunlight, nostalgic hand-drawn character outlines', 'Ikonický japonský styl s ručně malovaným pozadím a hřejivou atmosférou.'),
('cyberpunk', 'Cyberpunk', 'neon-noir aesthetic, high-contrast cyan and magenta lighting, rain-slicked surfaces, volumetric fog, gritty urban futuristic vibe', 'Atmosféra nočního města, ostré neonové kontrasty a deštivé odlesky.'),
('felted_wool', 'Plstěný', 'stop-motion needle felted wool texture, fuzzy organic fibers, soft tactile surfaces, handmade craft aesthetic', 'Unikátní vzhled vlněných postaviček s viditelnými vlákny vlny.'),
('paper_cutout', 'Vystřihovánka', 'layered papercraft art, 3D depth between paper sheets, subtle drop shadows, vibrant cardstock textures, diorama style', 'Vrstvený papír s hlubokými stíny vytvářející efekt prostorového diorámatu.'),
('claymation', 'Hliněný', 'plasticine claymation style, visible fingerprint textures, slightly irregular organic modeling, stop-motion animation aesthetic', 'Styl plastelíny s přiznanými otisky prstů a ručním modelováním.'),
('pop_art', 'Pop Art', '1960s pop art aesthetic, Ben-Day dots, halftone patterns, bold primary colors, thick black outlines, screen-printed look', 'Výrazné barvy a komiksová tečkovaná estetika ve stylu Andyho Warhola.'),
('dark_oil', 'Temná malba', 'dramatic oil on canvas, heavy impasto brushstrokes, chiaroscuro lighting, deep moody shadows, classical fine art texture', 'Dramatické stíny (šerosvit), husté nánosy barev a textura klasického plátna.'),
('vintage_parchment', 'Starý pergamen', 'ancient manuscript style, sepia ink drawings on yellowed weathered parchment, burnt edges, historical cartography aesthetic', 'Vzhled historického rukopisu na zažloutlém, poškozeném papíře.'),
('pixel_art', 'Pixel Art', 'nostalgic 16-bit pixel art, crisp square pixels, limited color palette, retro video game aesthetic, stylized dithered shading', 'Nostalgický vzhled starých videoher s viditelnými pixely.'),
('frozen_crystal', 'Ledové království', 'crystalline ice textures, refracted sub-zero lighting, glowing frost patterns, iridescent winter sparkle, translucent blue tones', 'Krystalické textury, modravé tóny a zimní třpyt s lomem světla v ledu.'),
('happy_cloud', 'Veselý mráček', 'ultra-soft kawaii pastel aesthetic, puffy rounded shapes, dreamy gradients, joyful and innocent atmosphere, minimal soft outlines', 'Pastelový, měkký styl s oblými tvary a roztomilou, veselou náladou.')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  prompt_en = EXCLUDED.prompt_en,
  description = EXCLUDED.description;
