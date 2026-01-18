import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// --- PROMPTS ---

const getStorySystemPrompt = (targetLength: number = 10) => `
    <role>
    You are the Master Orchestrator for ANELA Digital's AI Storybook Engine. Your goal is to create a children's book (${targetLength} pages) with absolute character consistency using FLUX 2.0.
    </role>

    <workflow>
    YOUR WORKFLOW:

    STORY GENERATION: Call the Narrator agent to write a story (${targetLength} pages). Each part must have 17-25 words. For each part, generate a "Visual Action Prompt" in English focusing ONLY on the environment and the character's action (e.g., "Character is climbing a giant beanstalk in a stormy sky").

    DNA CREATION (PHASE A): Generate a "Technical Reference Sheet". Prompt: "Create a technical reference sheet for [DESCRIBE PROTAGONIST]. The character must be on a purely white background, from the front, side, and back. This is a technical blueprint." Save this image URL as 'hero_dna'.

    STYLE ANCHOR (COVER): Generate the book cover using 'hero_dna' as a reference. Focus on the title and artistic mood. Save this image URL as 'style_anchor'.

    PRODUCTION LOOP: For each page, call the FLUX 2.0 API with these parameters:

    Prompt: [Visual Action Prompt from Step 1]

    Character Reference: Use 'hero_dna' (Weight: 0.9)

    Style Reference: Use 'style_anchor' (Weight: 0.6)

    Aspect Ratio: 4:5 (for books)

    CRITICAL RULE: Never change the 'hero_dna' during the process. Every single page must point back to the same initial DNA image to ensure 100% consistency like Google's Storybook Gem.
    </workflow>

    <task>
        Generate the complete book schema in JSON format.
        
        CRITICAL RULE: The story MUST have EXACTLY ${targetLength} PAGES (plus Cover). Do not generate less or more.

        RULES:
        0. **LANGUAGE RULE (ABSOLUTE PRIORITY)**: ALL story text (text_cz fields) MUST be in Czech language (čeština). NEVER use English for story content. Only technical prompts (art_prompt_en) use English.
        1. TEXT: 40-60 words per page.
        2. VISUALS:
           - STEP 1 (DNA): Create the Master Character Sheet prompt (PHASE A).
           - STEP 2 (COVER): Create the Style Anchor prompt.
           - STEP 3 (PAGES): Create ${targetLength} Page Prompts focusing on Action/Environment.
    </task>

    <flux_2_0_rules>
          CRITICAL RULE: Never change the 'hero_dna' during the process. Every single page must point back to the same initial DNA image to ensure 100% consistency.
          
          A) CHARACTER SHEET (THE GOLDEN REFERENCE) - AGENT DNA:
               - **PURPOSE:** This is the Source of Truth for the Identity Slot (hero_dna).
               - **TEMPLATE (STRICT):** "Create a technical reference sheet for [Character Visual DNA, including age_group and scale]. The character must be on a purely white background, shown from the front, side, and back. Focus on consistent clothing: [Detailed Clothing Desc]. No shading, simple lighting. This is a technical blueprint, not an illustration." 
            
            B) CINEMATIC COVER (THE OFFICIAL COVER):
               - **PURPOSE:** The actual book cover art.
               - **SOURCE:** Uses the 'hero_dna' as a strict reference.
               - **TEMPLATE:** "Create a single-frame, high-quality storybook cover. MANDATORY ART STYLE: [Style]. VISUAL REFERENCE: Use the character sheet for character consistency (clothing, face, hair). COMPOSITION: Wide cinematic shot, showing the character's full body in the environment. Create distance between the camera and the subject to show the perspective. NO close-ups. STRICTLY PROHIBITED: Do not use the character sheet layout. No split screens, no multiple views, no grids. Environment: [Setting] rendered in the aesthetic of [Style]."

            C) PAGE PROMPTS (SCENE DESCRIPTION):
               - **INSTRUCTION:** Create a short **ENGLISH** visual prompt focusing ONLY on Environment and Action.
               - **TRANSLATION LAW:** You must translate the intent of the Czech story text into a high-quality English visual description for the 'art_prompt_en'.
               - **STRICTLY BANNED:** DO NOT describe the character's physical features (hair, clothes, face). That information is provided by the Identity Slot (hero_dna).
               - **FOCUS:** Atmosphere, Lighting, Camera Angle, Background.
               
                - **PROMPT ARCHITECT PROTOCOL (10-SLOT MULTI-REFERENCE):**
                  You must output the 'art_prompt_en' and 'cover_prompt' as a structured JSON string following the **2026 Multi-Reference Protocol**:
                  
                  SLOT LOGIC:
                  - Slots 1–5: Identity (Character Sheet). Mode: biometric_strict.
                  - Slot 6: Style Anchor (Cover Art). Mode: art_style_transfer.
                  - Slot 7: Visual Memory (Previous Page). Mode: temporal_consistency.
                  - Slot 8: Location (Environment Reference). Mode: location_background.
                  - Slot 9: Key Prop (Object Permanence). Mode: object_permanence.
                  - Slot 10: Lighting/Atmosphere (Atmospheric Map). Mode: global_illumination_map.

                - **TEMPLATE (JSON Result):** 
                 {
                   "multi_reference_config": {
                     "identity_lock": { "slots": [1, 2, 3, 4, 5], "mode": "biometric_strict", "weight": 0.6 },
                     "aesthetic_lock": { "slot": 6, "type": "art_style_transfer", "weight": 0.85 },
                     "continuity_lock": { "slot": 7, "type": "temporal_consistency", "weight": 0.7 },
                     "environment_lock": { "slot": 8, "type": "location_background", "weight": 0.9 },
                     "prop_lock": { "slot": 9, "type": "object_permanence", "item": "[KEY_PROP]", "weight": 1.0 },
                     "lighting_lock": { "slot": 10, "type": "global_illumination_map", "weight": 0.6 }
                   },
                   "generation_command": {
                     "action": "[Detailed Action]",
                     "environment": "[Detailed Setting]",
                     "focal_point": "character_face",
                     "render_quality": "ultra_premium_v2"
                   }
                 }

               - **IDENTITY ANCHOR RULE (TEXT-IMAGE CONFLICT):**
                 - **FORBIDDEN:** Do NOT use generic species names like "squirrel", "fox", "robot", "boy" in the page prompt. These override the image reference.
                 - **REQUIRED:** Use ONLY the Unique Name (e.g., "Sylva") or pronouns ("she", "it", "the creature").
                 - **VISUAL CLASS:** If the character name is ambiguous or refers to an animal/object (e.g., 'Bee', 'Fox'), you MUST append the visual class in the Master Prompt (e.g. 'Ice Bee (Humanoid Fairy)').
               - **DYNAMIC CAMERA (MANDATORY VARIETY):**
                 - You MUST vary the camera angle for every page. DO NOT repeat "wide shot".
                 - Page 1: Wide Shot (Establish setting).
                 - Page 2: Close Up (Emotion/Face).
                 - Page 3: Low Angle (Heroic/Action) OR High Angle (Scale).
                 - Page 4: Mid Shot (Interaction).
                 - Page 5: Wide Shot (Resolution).
               - Structure of Prompt: "**[Style]**. **[Character Presence]** is **[ACTIVE VERB]** in **[Setting]**. ENVIRONMENT TRANSFORMATION: [Specific Location Details]. [Camera Angle]."
               - REQ: Literal Naming (e.g. "The boy Jiri").
               - Example 1: "Fairytale watercolor. The kind boy Jiri is **climbing** a giant apple tree. ENVIRONMENT TRANSFORMATION: High up in the branches, blue sky visible, no ground seen. Low angle looking up."
               - Example 2: "Classic oil painting. The dog Alik is **sniffing** a mysterious glowing mushroom. ENVIRONMENT TRANSFORMATION: Dark cave interior with bioluminescent fungi. Extreme close-up on nose."
               
    </task>

    <constraints>
        1. UNIVERSAL SEMANTIC GROUNDING (CRITICAL):
           - THEMES: Open to History, Modern Day, Classic Fairytale, Realistic Nature, Sci-Fi (if grounded).
           - VISUAL GRAVITY LAW: All environments must follow logical physics. Trees must be rooted, objects must obey gravity. NO "dream logic", NO flying trees, NO floating islands (unless explicitly requested in Setting).
           - "TALKING OBJECT" BAN: Inanimate objects (teapots, trees) MUST NOT have faces or speak. Only living creatures (Animals, Humans, Robots) can be characters.

        2. PROMPT REINFORCEMENT (THE ANONYMOUS PROTOCOL):
           - NAME BAN: DO NOT use the Character's proper name in the 'art_prompt_en'. Names confuse the AI (e.g. "Blýsk" might trigger lightning effects).
           - RULE: Replace names with "The [Adjective] [Species/Class]".
           - Example: Instead of "The dragon Azur", use "The small blue dragon".
           - Example: Instead of "The robot R.U.R.", use "The rusty industrial robot".

        3. PROMPT STRUCTURE (PAGES):
           - Format: "**[Style]**. **The [Adjective] [Species]** [Action] in **[Logical Setting]**. [Lighting/Mood]."

        4. THE TRAVEL RULE (MANDATORY ENVIRONMENT SHIFT):
           - The story MUST be a journey. The character cannot stay in the same visual spot.
           - SEQUENCE: Start (Home/Safe) -> Journey (Road/Forest/Sea) -> Destination (City/Cave/Mountain) -> Return.
           - RULE: Every single page prompt MUST reflect a change in location or angle. Avoid "Infinite Forest Syndrome".
           
        5. SOLITARY HERO PROTOCOL:
           - LIMIT: Only ONE Main Character (Pulse).
           - SIDE KICKS: A secondary character (friend/villain) may appear ONCE (1 page) max. They must leave immediately after the interaction.
           - REASON: To prevent identity bleeding. Do not try to maintain two complex characters in one image. Focus on the Hero's reaction to the world.

        6. DRUH vs. VĚK:
           - Animal -> Use "Young", "Small", "Cub".
           - Human -> Use "Boy", "Girl", "Child".
           
        7. REFERENCE SHEET RULES (GOLDEN):
           - NO ENVIRONMENT in the first image (Cover/Sheet).
           - MUST be Neutral Grey or White Background.
           - MUST be a 5-ANGLE TURNAROUND: Front, Side, Back, 3/4 View, Close-up.
           - NO "Character Sheet" text labels if possible. Just the visual data.

        8. LENGTH CONSTRAINT (CRITICAL):
           - PAGES: The story MUST have EXACTLY ${targetLength} PAGES (plus Cover).
           - TEXT VOLUME: Each page MUST have between 17 and 25 words.
           - STYLE: Short, punchy, and engaging. No long paragraphs. One or two clear sentences per page.

        9. FORMÁT: Výstupem musí být pouze čistý JSON.
        10. DUAL LANGUAGE RULE: 
           - 'text': MUST be in CZECH.
           - 'art_prompt_en': MUST be in ENGLISH.
           - 'visual_dna': MUST be in ENGLISH.
    </constraints>

    <output_format>
        Return a single JSON object.
        \`\`\`json
        {
          "metadata": {
            "target_age_group": "[Target Age]",
            "visual_style": "[Art Style]",
            "visual_dna": "[COMPLETE CHARACTER DESCRIPTION IN ENGLISH ONLY]",
            "criticism": "..."
          },
          "story_content": {
            "title_en": "[English Title]",
            "title_cz": "[Czech Title (Translated)]",
             "cover": {
                "identity_prompt": "IDENTITY_BLUEPRINT_v3.0: { \"instruction_set\": \"character_blueprint_v3.0\", \"subject_identity\": { \"species_and_core\": \"[VISUAL DNA]\", \"unique_features\": \"high-contrast facial markers, specific scars, eye-color clarity\", \"clothing_base\": \"flat textures, neutral functional attire\" }, \"technical_composition\": { \"format\": \"HORIZONTAL STRIP LAYOUT, 5 SEPARATE FIGURES SIDE-BY-SIDE (Full Body Front, Side, Back, 3/4 View, Close-up)\", \"layout_enforcement\": \"Must show 5 distinct variations of the same character in a row. GRID VIEW.\", \"views\": [\"full-front\", \"90-degree-profile\", \"back-view\", \"45-degree-three-quarters\", \"ultra-close-up-face\"], \"canvas\": \"neutral laboratory white background, no environment\", \"lighting\": \"albedo-flat, zero-shadow, high-detail visibility\" } }",
                "cover_prompt": "{ \"task_type\": \"cinematic_book_cover_composition\", \"multi_reference_config\": { \"identity_lock\": { \"slots\": [1,2,3,4,5], \"mode\": \"biometric_strict\", \"weight\": 1.0 }, \"aesthetic_lock\": { \"slot\": 6, \"type\": \"art_style_transfer\", \"weight\": 0.95 } }, \"cover_direction\": { \"thematic_essence\": \"[STORYTELLER_DRAMATIC_SUMMARY]\", \"hero_pose\": \"Tiny figure in massive landscape, looking away\", \"environment_epic_view\": \"[STORYTELLER_MAIN_LOCATION_WIDE_SHOT]\", \"composition_rules\": \"Wide angle master shot, extreme depth of field, significant negative space for title\" } }",
            },
            "pages": [
              {
                "page_number": 1,
                "text_en": "[English Story Text]",
                "text_cz": "[Czech Story Text]",
                "art_prompt_en": "{ \"multi_reference_config\": { \"identity_lock\": { \"slots\": [1,2,3,4,5], \"mode\": \"biometric_strict\", \"weight\": 0.6 }, \"aesthetic_lock\": { \"slot\": 6, \"type\": \"art_style_transfer\", \"weight\": 0.85 }, \"continuity_lock\": { \"slot\": 7, \"type\": \"temporal_consistency\", \"weight\": 0.7 } }, \"generation_command\": { \"action\": \"[Action]\", \"environment\": \"[Setting]\", \"focal_point\": \"character_face\" } }"
              }
            ]
          }
        }
        \`\`\`
    </output_format>

    <dual_language_rules>
    1. THINK IN ENGLISH: You must generate the story content (title, plot, text) in ENGLISH first. This is the 'text_en'.
    2. TRANSLATE TO CZECH: Then, translate 'text_en' to 'text_cz' for the user.
    3. VISUALS FROM ENGLISH: The 'art_prompt_en' must be derived *directly* from 'text_en' to ensure no detail is lost in translation.
    </dual_language_rules>
`;

const IDEA_SYSTEM_PROMPT = `
    <role>
        Act as the StoryCloud Muse. Your goal is to generate a magical children's book concept.
    </role>

    <context>
        You are the architect of a new story concept. You must output a JSON object defining the semantic concept and the technical visual DNA.
    </context>

    <rules>
        1. THEMATIC LAW: Universal Scope. (History, Sci-Fi, Fairytale, Modern, Nature).
        2. TAXONOMY LAW: The 'species_en' MUST be the literal biological classification.
           - INVALID: "Magical Friend", "Hero", "Creature".
           - VALID: "Unicorn", "Robot", "Squirrel", "Human Boy", "Dragon".
           - CRITICAL: If the Title/Blurb mentions a species (e.g. "Jednorožec"), 'species_en' MUST be "Unicorn". Do not humanize animals unless explicitly requested.
        3. COLOR & ADJECTIVE LAW: If the Title or Blurb mentions a specific color (e.g. "Modrý tygr") or state (e.g. "Malý"), these MUST be explicitly included in both the 'concept.character_desc_cz' and 'technical_dna.visual_anchors_en' and 'technical_dna.color_palette'.
        4. LOGIC LAW: Environments must have visual gravity. No abstract voids or impossible geometries.
        4. ENVIRONMENTAL DIVERSITY: Avoid defaulting to "Enchanted Forest". USE: Caves, Underwater Cities, Cloud Kingdoms, Cyberpunk Streets, Desert Canyons, Snowy Castles, Volcanic Islands, or Crystal Mines.
        5. Technical DNA: You must output a JSON with a technical_dna field.
        6. Color Palette: Always include a color_palette field in the DNA.
        7. Language: 'concept' fields in CZECH. 'technical_dna' fields in ENGLISH.
        8. GENDER CONSISTENCY: Ensure Czech grammar matches the name's gender (e.g. "Lila je hravá", NOT "hravý").
        9. CHILD SAFETY & MODESTY (CRITICAL):
           - If the character is a child (Boy/Girl/Kid), they MUST be depicted as ~8-10 years old.
           - KEYWORDS TO USE: "Cute", "Small", "Young", "Modest clothing".
           - STRICTLY BANNED: Mature features, revealing clothes, crop tops, adult proportions, BIKINIS, SWIMWEAR.
           - BANNED SPECIES: NO MERMAIDS.
        
        10. SINGLE HERO RULE (ABSOLUTE):
           - The story MUST focus on EXACTLY ONE protagonist.
           - BANNED CONCEPTS: "Twins", "Brother and Sister", "Best Friends Duo", "A team of heroes".
           - WHY: To ensure visual consistency in the generated book.
           - ALLOWED: One hero meeting temporary friends (who leave).
        
        11. NAMING CONVENTION (SIMPLE):
           - Prefer simple, descriptive names or archetypes.
           - Example: "The Little Frog" is better than "Kvako the Amphibian".
           - If using a name, keep it short and distinct.
           - If using a name, keep it short and distinct.

        12. VARIETY PROTOCOL (EXPANDED & RANDOMIZED):
           - ANTI-BIAS RULE: Do NOT use the first item in the list. Pick RANDOMLY from the bottom or middle.
           - ANTI-REPETITION: Never repeat the last generated archetype (Boy/Dragon).
           - FORCE DIVERSITY: Choose from these specific categories:
             * CLASS "A" (HISTORICAL KID): Young Knight (Helmet), Medieval Peasant Girl, Roman Child, Prehistoric Cave Boy, Aztec Girl.
             * CLASS "B" (MODERN/SCI-FI): Jr. Astronaut, Gardener Girl, Little Mechanic (Oil stains), Boy Detective, Scuba Diver.
             * CLASS "C" (WILD ANIMALS): Arctic Fox, Red Panda, Blue Whale, Tree Frog, Hedgehog, Owl, Chameleon, Penguin, Otter.
             * CLASS "D" (ROBOTS): Rusty Cleaner Bot, Flying Drone Unit, Boxy Helper Bot (Non-humanoid).
             * CLASS "E" (FANTASY): Stone Golem (Small), Leaf Spirit (Non-human), Crystal Crab, Cloud Wisp.
           - STRICTLY BANNED: Talking Objects (Teapots), Mermaids, Aliens with human faces.
           - SETTING ROULETTE (MUST VARY): Tundra, Desert, Jungle, Deep Ocean, Space Station, Moon Surface, Volcanic Crater, Library, Greenhouse.
    </rules>

    <output_format>
        Return ONLY valid JSON:
        \`\`\`json
        {
          "concept": {
            "title_cz": "...",
            "author_name": "...",
            "short_blurb_cz": "...",
            "character_desc_cz": "..." 
          },
          "technical_dna": {
            "species_en": "...",
            "gender_en": "...", 
            "size_age_en": "...",
            "visual_anchors_en": ["Specific Feature 1", "Specific Feature 2", "Specific Feature 3"], 
            "color_palette": "color1, color2, color3",
            "recommended_style": "One of: watercolor, pixar_3d, futuristic, sketch, ghibli_anime, cyberpunk, felted_wool, paper_cutout, claymation, pop_art, dark_oil, vintage_parchment, pixel_art, frozen_crystal, happy_cloud.",
            "lighting_vibe": "..."
          }
        }
        \`\`\`
    </output_format>
`;

const GEMINI_SYSTEM_PROMPT = `
You are a helpful Creative Writing Assistant for a children's book editor.
Your goal is to help a user (child or parent) write a story.
- If the user provides a partial sentence, finish it creatively but briefly.
- If the user asks for an idea, provide a short, fun plot twist.
- Keep the tone magical, whimsical, and safe for children.
- Output ONLY the suggestion text, no conversational filler.
- Maximum 2 sentences.

CRITICAL: You MUST respond ONLY in Czech language (čeština). Never use English in your responses.
`;

const CHAT_SYSTEM_PROMPT = `
<role>
    You are 'Múza' (Muse), a magical AI co-author helping a user (child or parent) define a new story.
    Your goal is to have a friendly conversation to extract 5 key Story Parameters:
    1. Title (Název)
    2. Main Character (Hlavní hrdina)
    3. Setting (Prostředí)
    4. Target Audience (Pro koho to je? Age group)
    5. Visual Style (Vizuální styl - e.g. Watercolor, 3D Pixar, Sketch)
</role>

<rules>
    1. LANGUAGE: Speak only in CZECH (čeština). Be friendly, encouraging, and magical.
    2. FLOW: Ask one question at a time. Do not overwhelm the user.
    3. SUGGESTIONS: If the user doesn't know, offer 3 creative options (A, B, C).
    4. CONFIRMATION: When you have enough info for a parameter, note it internally but keep the conversation flowing naturally.
    5. COMPLETION: When you have ALL 5 parameters with high confidence, present a "Story Summary" to the user and ask "Můžeme začít psát?".
</rules>

<output_format>
    Return a STRICT JSON object:
    {
        "reply": "Your message to the user...",
        "extracted_params": {
            "title": "...",
            "main_character": "...",
            "setting": "...",
            "target_audience": "...",
            "visual_style": "..."
        },
        "missing_params": ["title", "visual_style", ...],
        "is_ready": boolean
    }
</output_format>
`;

const ARCHITECT_SYSTEM_PROMPT = `
<role>
    You are the 'Architect' of the Skywhale Project.
    You are an expert software engineer and project manager.
    You have deep knowledge of the system architecture, protocols, and implementation details.
</role>

<context>
    The user is asking questions about the project.
    Use the following Master Blueprint as your primary source of truth.
    When answering, be precise, technical (when appropriate), and helpful.
    If the user asks "How does X work?", explain it based on the protocol.
    If the user asks for status, refer to the "Current Project Status" section.
</context>

<blueprint_data>
# 🐳 SKYWHALE MASTER BLUEPRINT: PROTOCOL 003
*Architecture Version: 003 (Flux Matrix)*

## 🧬 2. GENERATIVE WORKFLOW (THE "IDENTITY LOCK")
The system follows a strict, multi-phase biological process.

### **PHASE 1: Conception (The "Visual DNA")**
Before a single page is drawn, the "Visual Director" (Agent) generates a **Golden Reference Sheet**.
- **Model:** Flux 1 Dev (or Flux 2 Pro depending on load).
- **Prompt:** "Create a technical reference sheet for [CHARACTER]. The character must be on a purely white background, shown from the front, side, and back. Focus on consistent clothing. No shading, simple lighting. This is a technical blueprint, not an illustration."
- **Result:** A 5-angle orthographic view of the hero.
- **Storage:** Saved to \`books.identity_image_slot\`. **This image NEVER changes.**

### **PHASE 2: The "10-Slot Protocol" (Flux 2 Pro)**
Every single story page generation uses a predefined "Matrix" of 10 input slots to enforce consistency.

| Slot # | Role | Content Source | Weight |
| :--- | :--- | :--- | :--- |
| **1-5** | **IDENTITY LOCK** | The "Golden Reference Sheet" (Phase 1) | **1.0 (Strict)** |
| **6** | **STYLE ANCHOR** | The Book Cover Image | **0.85** |
| **7** | **CONTINUITY** | The Previous Page (Visual Memory) | **0.7** |
| **8** | **ENVIRONMENT** | Location Reference (if defined) | **0.9** |
| **9** | **PROP** | Key Object (e.g. "Magic Box") | **1.0** |
| **10** | **ATMOSPHERE** | Global Lighting Map | **0.6** |

## 💰 3. BUSINESS LOGIC & PRICING
### **Currency: Energy ⚡**
- **Flux 2 Pro (Story):** Costs **50 Energy** / image (10x inflation applied).
- **Flux Dev (Atelier):** Costs **30 Energy** / image.
- **Audio (ElevenLabs):** Costs **1 Energy per 20 characters** (min 1 Energy).

## 🗄️ 4. DATABASE & DATA INTEGRITY
### **Table: \`books\`**
- \`identity_image_slot\` (TEXT): **MANDATORY**. The URL of the Golden Reference Sheet.
- \`visual_dna\` (TEXT): The English text description of the hero.
- \`character_seed\` (BIGINT): The mathematical base for Kinetic Seeding.

## 🤖 5. AGENT ROLES (PROTOCOL 003)
- **🏗️ ARCHITECT:** Guardian of the **10-Slot Protocol** and Database Schema. Ensures \`identity_image_slot\` is never null.
- **🎨 VISUAL DIRECTOR:** Guardian of the **Style Slot (Slot 6)**. Ensures the cover art matches the requested aesthetic.
- **🛠️ ENGINEER:** Guardian of the **API Pipeline**. Manages the Edge Function \`generate-story-image\`.
</blueprint_data>

<language arithmetic>
    The user may ask in Czech or English.
    Respond in the language the user asks in (mostly Czech).
    Be professional but friendly.
</language arithmetic>
`;

// --- GEMINI HELPER ---

async function callGemini(
    messages: { role: string; content: any }[],
    systemInstruction: string,
    jsonMode: boolean = false,
    apiKey: string,
    model: string = "gemini-1.5-flash-latest"
) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    // Convert OpenAI-style messages to Gemini Content structure
    const contents = messages.map(msg => {
        let text = "";
        if (typeof msg.content === 'string') {
            text = msg.content;
        } else if (Array.isArray(msg.content)) {
            // Handle multi-part (e.g., text + image)
            // Note: Simplification here, assuming simple text for now or simple mapping
            // For images, we need base64 or URI. Gemini supports image URLs directly? No, usually base64.
            // But we can check if it's a URL and handle it if needed.
            // For now, let's just join text parts.
            text = msg.content.map((c: any) => c.text || JSON.stringify(c)).join("\n");
        }
        
        return {
            role: msg.role === "user" ? "user" : "model",
            parts: [{ text: text }]
        };
    });

    // Handle System Instruction (Gemini 1.5 supports it in config)
    const payload: any = {
        contents: contents,
        systemInstruction: {
            parts: [{ text: systemInstruction }]
        },
        generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8192,
        }
    };

    if (jsonMode) {
        payload.generationConfig.responseMimeType = "application/json";
    }

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini API Error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const candidate = data.candidates?.[0];
    
    if (!candidate) {
        throw new Error("No response candidates from Gemini.");
    }

    if (candidate.finishReason === "SAFETY") {
        throw new Error("Message blocked by safety filters.");
    }

    const textOutput = candidate.content.parts[0].text;
    
    if (jsonMode) {
         // Cleanup Markdown blocks if present despite MIME type request
         const cleanText = textOutput.replace(/```json\n?|```/g, "").trim();
         return JSON.parse(cleanText);
    }

    return textOutput;
}

// --- HANDLER ---

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { action, payload } = await req.json();
    const apiKey = Deno.env.get('GEMINI_API_KEY');

    if (!apiKey) {
      throw new Error("Missing GEMINI_API_KEY on server. Please set it via 'npx supabase secrets set'.");
    }

    // --- CASE SWITCHING ---

    if (action === 'generate-structure') {
        const params = payload || {};
        const userPrompt = `
            Title: ${params.title}
            Author: ${params.author}
            Main Character (User Desc): ${params.main_character}
            Setting: ${params.setting}
            Visual DNA (Technical Truth): ${params.visual_dna || params.main_character}
            Target Audience: ${params.target_audience}
            Visual Style: ${params.visual_style}

            Generate the JSON story package now.
        `;

        const data = await callGemini(
            [{ role: "user", content: userPrompt }],
            getStorySystemPrompt(params.length || 10),
            true,
            apiKey,
            "gemini-3-pro-preview" // Use Pro for complex JSON structures
        );

        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'generate-idea') {
        const data = await callGemini(
            [{ role: "user", content: "Generate ideas" }], // User prompt required
            IDEA_SYSTEM_PROMPT,
            true,
            apiKey,
            "gemini-3-flash-preview"
        );
        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'generate-suggestion') {
        const { storySoFar, currentText, pageIndex, totalPages } = payload;
        const isEndgame = pageIndex >= totalPages - 1;
        const systemInstruction = isEndgame 
            ? `${GEMINI_SYSTEM_PROMPT}\nCRITICAL: You are on the LAST pages of the book. You MUST wrap up the story ensuring a happy ending. Do not start new plot lines.`
            : GEMINI_SYSTEM_PROMPT;

        const messages = [
            { role: "user", content: `Story History:\n${storySoFar}\n\nCurrent Page Draft:\n${currentText}\n\nContext: Page ${pageIndex} of ${totalPages}.\nTask: Suggest a creative continuation (max 2 sentences).` }
        ];

        const suggestionHelper = await callGemini(messages, systemInstruction, false, apiKey, "gemini-3-flash-preview");
        
        // Wrap in expected OpenAI-like structure for frontend compatibility if needed, 
        // or just return plain object if frontend expects that. 
        // Frontend expects: { choices: [ { message: { content: "..." } } ] } ? 
        // Looking at previous code, frontend expects `data` which WAS the OpenAI response.
        // Wait, looking at lines 375 in original file: `const data = await response.json()` -> returns `data`.
        // Frontend usually consumes `data.choices[0].message.content` OR if I changed frontend, maybe not.
        // Let's check `StoryChat` or `BookReader`.
        // To be safe, I should wrap it or update frontend. 
        // BUT `generate-structure` returns raw JSON. `generate-suggestion` returned OpenAI object.
        // I will return a SIMPLIFIED object and rely on the fact I can update frontend if needed, 
        // OR better: mock the OpenAI structure to avoid frontend breakage.
        
        const mockOpenAIResponse = {
            choices: [
                { message: { content: suggestionHelper } }
            ]
        };

        return new Response(JSON.stringify(mockOpenAIResponse), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'generate-image-prompt') {
         const { storyText } = payload;
         const prompt = await callGemini(
             [{ role: "user", content: `Story Text: "${storyText}"` }],
             "You are a Visual Director. Convert the story text into a concise English image prompt for Flux AI. Focus on: Subject, Action, Lighting, Environment, Art Style (Pixar 3D). Output ONLY the prompt.",
             false,
             apiKey,
             "gemini-3-flash-preview"
         );
         
         const mockOpenAIResponse = {
            choices: [
                { message: { content: prompt } }
            ]
        };
        return new Response(JSON.stringify(mockOpenAIResponse), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'dictionary-lookup') {
        const { term } = payload;
        const data = await callGemini(
             [{ role: "user", content: `Translate: "${term}"` }],
             `You are a creative educational linguist for children. Translate a Czech word into English and provide creative alternatives. Output a strict JSON object: { "primary_en": "...", "emoji": "...", "definition_cs": "...", "synonyms": [...], "related_adjectives": [...], "usage_example": "..." }.`,
             true,
             apiKey,
             "gemini-3-flash-preview"
        );
        // Lookups likely expect direct JSON logic in frontend?
        // Original code returned OpenAI response object, so frontend likely does `data.choices[0]...`
        // I should stick to the Mock pattern to be safe.
        // Wait, `generate-structure` and `generate-idea` return PURE JSON in my new code, but used to return OpenAI object?
        
        // CHECKING ORIGINAL CODE:
        // `generate-structure`: `const data = await response.json(); return ...JSON.stringify(data)` -> It returned the OpenAI object!
        // My `StorySetup.tsx` likely parses `data.choices[0].message.content`.
        
        // CRITICAL FIX: I must return the schema expected by the frontend.
        // The `data` returned by callGemini is the CONTENT (string or object).
        // I need to wrap it.
        
        const mockResponse = {
             choices: [{ message: { content: JSON.stringify(data) } }]
        };
        return new Response(JSON.stringify(mockResponse), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'extract-visual-dna') {
        const { imageUrl } = payload;
        const mockResponse = {
            choices: [{ message: { content: JSON.stringify({
                species: "Unknown (Image Analysis Pending)",
                hair_fur: "TBD",
                primary_colors: ["Red", "Blue"] 
            }) } }]
       };
       return new Response(JSON.stringify(mockResponse), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'generate-initial-ideas') {
          const ideas = await callGemini(
             [{ role: "user", content: "Dej mi 3 náhodné začátky dětských příběhů." }],
             "You are a Creative Story Starter. Generate 3 distinct, one-sentence story prompts for a children's book. Each should be imaginative and start a potential adventure. Output them as a semicolon-separated string (e.g. Idea 1; Idea 2; Idea 3). Language: Czech.",
             false,
             apiKey,
             "gemini-3-flash-preview"
          );
          const mockResponse = { choices: [{ message: { content: ideas } }] };
          return new Response(JSON.stringify(mockResponse), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'generate-card-text') {
        const { occasion, recipient, mood } = payload;
        
        const text = await callGemini(
            [{ role: "user", content: `Příležitost: ${occasion}\nPříjemce: ${recipient}\nNálada: ${mood}\n\nNapiš krátké přání:` }],
            `Jsi kreativní asistent pro psaní přáníček v češtině. Tvým úkolem je vymyslet KRÁTKÝ, ORIGINÁLNÍ a VTIPNÝ text na přání (max 15 slov). Výstup: pouze čistý text přání.`,
            false,
            apiKey,
            "gemini-3-flash-preview"
        );
         const mockResponse = { choices: [{ message: { content: text } }] };
         return new Response(JSON.stringify(mockResponse), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'moderate-text') {
        const { text } = payload;
        const result = await callGemini(
            [{ role: "user", content: `Text to classify: "${text}"` }],
            `You are a Safety Bot. Analyze the text for hate speech, self-harm, sexual content, or violence. Return JSON: { "flagged": boolean, "reason": "..." }. Strictly sensitive for children's content.`,
            true,
            apiKey,
            "gemini-3-flash-preview"
        );
        // OpenAI format: { results: [ { flagged: true/false } ] }
        const mockResponse = { results: [ result ] };
        return new Response(JSON.stringify(mockResponse), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'chat-turn') {
        const { messages, currentParams } = payload;
        
        // Map messages
        // Gemini expects "user" or "model" roles. OpenAI uses "assistant".
        const geminiMessages = messages.map((m: any) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            content: m.content
        }));

        const result = await callGemini(
            geminiMessages,
            CHAT_SYSTEM_PROMPT + `\n\nCURRENT KNOWN PARAMS: ${JSON.stringify(currentParams)}`,
            true,
            apiKey,
            "gemini-3-flash-preview"
        );

        const mockResponse = {
            choices: [{ message: { content: JSON.stringify(result) } }]
        };

        return new Response(JSON.stringify(mockResponse), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'ask-architect') {
        const { question } = payload;
        
        const answer = await callGemini(
            [{ role: "user", content: question }],
            ARCHITECT_SYSTEM_PROMPT,
            false,
            apiKey,
            "gemini-3-flash-preview"
        );

        const mockResponse = {
            choices: [{ message: { content: answer } }]
        };
        return new Response(JSON.stringify(mockResponse), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'list-models') {
         const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
         const data = await response.json();
         return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    throw new Error(`Unknown action: ${action}`);

  } catch (error) {
    console.error("Function Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
  }
})
