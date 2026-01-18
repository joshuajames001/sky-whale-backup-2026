import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.json();
    console.log("📥 Příchozí data:", JSON.stringify(body));

    const { 
        prompt, 
        image_prompt_url, // Legacy
        character_reference, // Single string or array
        character_references, // Array
        style_reference, // Single string or array
        style_references, // Array
        seed, 
        model 
    } = body;

    // 1. SAFE INTEGER PARSING & GENESIS SEED STRATEGY
    let safeSeed: number;

    if (seed !== undefined && seed !== null && seed !== "null") {
        const parsed = Number(seed);
        if (!isNaN(parsed) && Number.isInteger(parsed)) {
            safeSeed = parsed;
        } else {
            console.warn(`⚠️ Invalid seed provided (${seed}), falling back to random Genesis Seed.`);
            safeSeed = Math.floor(Math.random() * 1000000000);
        }
    } else {
        console.log("🌱 Genesis Mode: Generating new random seed.");
        safeSeed = Math.floor(Math.random() * 1000000000);
    }

    // MODEL SELECTION LOGIC
    // Tier 'dev'/'basic' -> Flux 1 Dev (Standard/Economical)
    // Default/Tier 'pro' -> Flux 2 Pro (Advanced Consistency)
    let activeModel = 'black-forest-labs/flux-2-pro'; 
    if (model === 'dev' || model === 'basic') {
        activeModel = 'black-forest-labs/flux-dev'; // This is Flux.1 Dev
    }

    console.log(`INPUT CHECK: Prompt length: ${prompt?.length}, Seed: ${safeSeed}, Model: ${activeModel}`);

    // 0. LAUNCH LOG
    console.log("🚀 Edge Function: generate-story-image HIT");

    // --- CREDIT SYSTEM SECURITY (BYPASS MODE) ---
    // The Gateway might block User Tokens with 401. 
    // We allow passing the token in BODY to bypass Gateway check.
    
    let token = req.headers.get('Authorization')?.replace('Bearer ', '');
    // If the header token is missing or is the Anon Key (public), check body
    const isAnon = token === Deno.env.get('SUPABASE_ANON_KEY');
    
    if (!token || isAnon) {
       console.log("🕵️ Gateway Bypass: Checking body for user token...");
       if (body.access_token_bypass) {
           token = body.access_token_bypass;
           console.log("🔓 Found Token in Body!");
       } else if (isAnon) {
           throw new Error('Only Anon Key provided, missing User Token in body');
       }
    }

    if (!token) {
        console.error("❌ Missing Auth Token");
        throw new Error('Missing Authorization Token');
    }
    
    console.log(`🔐 Verifying Token (Length: ${token.length})`);

    // Create TWO clients:
    // 1. User-scoped client (for .auth.getUser validation)
    const supabaseUser = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { 
            auth: {
                persistSession: false // Function environment is stateless
            }
        }
    );

    // 2. Admin client (for RPC and balance update)
    const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Validate Token Explicitly
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser(token);
    
    if (authError || !user) {
        console.error('❌ Auth Error Details:', JSON.stringify(authError));
        throw new Error(`Invalid User Token: ${authError?.message}`);
    }
    
    console.log(`✅ User Authenticated: ${user.id}`);

    // 2. Determine Cost (10x Inflation)
    // Basic (Flux Dev) = 30 Energy (was 3)
    // Premium (Flux 2 Pro) = 50 Energy (was 5)
    // Note: The UI displays 'Package Prices', but this is the per-unit burn rate.
    const cost = (model === 'dev' || model === 'basic') ? 30 : 50;

    // 3. Check Balance
    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('energy_balance')
        .eq('id', user.id)
        .single();
    
    const currentBalance = profile?.energy_balance || 0;
    
    if (currentBalance < cost) {
        console.warn(`⛔ INSUFFICIENT ENERGY: User ${user.id} has ${currentBalance}, needs ${cost}`);
        return new Response(JSON.stringify({ error: "Insufficient Energy", code: "INSUFFICIENT_ENERGY" }), { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 402 // Payment Required
        });
    }

    // 4. Deduct Energy (Optimistic Locking not strictly needed for this scale, atomic update is fine)
    // We use the same 'add_energy' function but with negative value
    await supabaseAdmin.rpc('add_energy', {
        p_user_id: user.id,
        p_amount: -cost
    });

    console.log(`⚡ ENERGY BURN: Deducted ${cost} Energy from User ${user.id}. New Balance should be ~${currentBalance - cost}`);
    // ------------------------------

    // 2. Sestavení vstupu pro Replicate
    let finalPrompt = prompt;
    const inputImages: (string | null)[] = new Array(10).fill(null);

    // JSON PARSING FOR 10-SLOT PROTOCOL
    try {
        const parsedPrompt = JSON.parse(prompt);
        console.log("🧩 Detected JSON Protocol Payload");

        if (parsedPrompt.task_type === 'cinematic_book_cover_composition') {
            // COVER LOGIC
            const dir = parsedPrompt.cover_direction;
            const anchor = dir.subject_anchor ? `${dir.subject_anchor}. ` : "";
            finalPrompt = `${anchor}[Style: ${parsedPrompt.multi_reference_config?.aesthetic_lock ? 'Slot 6' : 'Anchor'}] - ${dir.thematic_essence}. Pose: ${dir.hero_pose}. Environment: ${dir.environment_epic_view}. Composition: ${dir.composition_rules}.`;
        } else if (parsedPrompt.multi_reference_config) {
            // PAGE LOGIC
            const gen = parsedPrompt.generation_command;
            const anchor = gen.subject_anchor ? `${gen.subject_anchor}. ` : "";
            finalPrompt = `${anchor}${gen.action} in ${gen.environment}. Focal point: ${gen.focal_point}. Quality: ${gen.render_quality}. [Using Slot 1-5 for Identity, Slot 6 for Style, Slot 7 for Continuity]`;
        }
    } catch (e) {
        // Not a JSON prompt, use raw string
        finalPrompt = prompt;
    }

    const inputPayload: any = {
      prompt: finalPrompt,
      aspect_ratio: "4:5", 
      output_format: "webp",
      output_quality: 80, 
      safety_tolerance: 5,
      seed: safeSeed 
    };

    // DUAL REFERENCE & MODEL SPECIFIC PARAMS
    if (activeModel.includes('flux-2-pro')) {
        // MAP SLOTS 1-10
        // Helper to collect references safely
        const collectRefs = (refs: any) => {
            const list: string[] = [];
            if (!refs) return list;
            if (Array.isArray(refs)) {
                refs.forEach(r => { if (r && typeof r === 'string') list.push(r); });
            } else if (typeof refs === 'string') {
                list.push(refs);
            }
            return list;
        };

        const allRefs = collectRefs(character_references || character_reference || image_prompt_url);
        const styleRefs = collectRefs(style_references || style_reference);

        // --- THE 2026 MULTI-REFERENCE PROTOCOL ASSEMBLY ---
        
        // Let's assume the incoming allRefs follows the order from App.tsx:
        // [DNA, StyleAnchor, Continuity, Environment, Prop, Lighting]
        
        // Slot 1-5: Identity (Primary DNA)
        const dnaUrl = allRefs[0] || null;
        if (dnaUrl) {
            for (let i = 0; i < 5; i++) inputImages[i] = dnaUrl;
        }

        // Slot 6: Style (Anchor)
        // Prefer explicit style_reference, fallback to allRefs[1] (Cover)
        inputImages[5] = styleRefs[0] || allRefs[1] || null;

        // Slot 7: Continuity (Temporal Memory)
        inputImages[6] = allRefs[2] || null;

        // Slot 8: Environment (Location Map)
        inputImages[7] = allRefs[3] || null;

        // Slot 9: Prop (Object Permanence)
        inputImages[8] = allRefs[4] || null;

        // Slot 10: Lighting (Atmospheric Map)
        inputImages[9] = allRefs[5] || null;

        // Final Filter and limit
        const finalImages = inputImages.filter(img => img !== null) as string[];

        if (finalImages.length > 0) {
            inputPayload.input_images = finalImages; 
            inputPayload.image_prompt_strength = 0.45; // 2026 Protocol: Adjusted to 0.45 to allow "Disneyfication" (Stylization) while keeping identity features. 0.70 was too strong (copy-paste).
            console.log(`🔗 2026 MULTI-REF PROTOCOL: Bound ${finalImages.length} images.`);
            console.log(`   - Slots 1-5 (Identity): ${inputImages[0] ? 'LOCKED' : 'EMPTY'}`);
            console.log(`   - Slot 6 (Style): ${inputImages[5] ? 'LOCKED' : 'EMPTY'}`);
            console.log(`   - Slot 7 (Continuity): ${inputImages[6] ? 'LOCKED' : 'EMPTY'}`);
            console.log(`   - Slot 8 (Environment): ${inputImages[7] ? 'LOCKED' : 'EMPTY'}`);
            console.log(`   - Slot 10 (Lighting): ${inputImages[9] ? 'LOCKED' : 'EMPTY'}`);
        }
    }

    // VERSION LOOKUP
    const verResp = await fetch(`https://api.replicate.com/v1/models/${activeModel}`, {
         headers: { "Authorization": `Token ${Deno.env.get('REPLICATE_API_TOKEN')}` }
    });
    const verData = await verResp.json();
    const versionId = verData.latest_version?.id;

    if (!versionId) throw new Error(`Could not retrieve latest version ID for model: ${activeModel}`);

    console.log(`🔹 Using Model Version: ${versionId} (${activeModel})`);

    // 3. Volání Replicate
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${Deno.env.get('REPLICATE_API_TOKEN')}`,
        "Content-Type": "application/json",
        "Prefer": "wait=60"
      },
      body: JSON.stringify({
        version: versionId,
        input: inputPayload
      }),
    });

    const prediction = await response.json();
    console.log("🤖 Replicate status:", response.status);

    if (!response.ok || prediction.error) {
      console.error("❌ REPLICATE API ERROR:", JSON.stringify(prediction));
      throw new Error(prediction.error || `Replicate API error: ${response.status}`);
    }

    // 4. Extrakce výsledku a seedu
    const replicateUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
    const usedSeed = prediction.seed || safeSeed || null;

    if (!replicateUrl) throw new Error("Replicate did not return an image URL.");

    // --- NEW: SERVER-SIDE PERSISTENCE ---
    console.log("💾 Persisting image to Supabase Storage...");
    
    // A. Download from Replicate
    const imageResponse = await fetch(replicateUrl);
    if (!imageResponse.ok) throw new Error(`Failed to download image from Replicate: ${imageResponse.status}`);
    const imageBlob = await imageResponse.blob();

    // B. Upload to Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const fileName = `story-images/${Date.now()}_${usedSeed}.webp`;
    const { data: uploadData, error: uploadError } = await supabaseClient
      .storage
      .from('story-assets')
      .upload(fileName, imageBlob, {
        contentType: 'image/webp',
        upsert: false
      });

    if (uploadError) {
      console.error("❌ Storage Upload Error:", uploadError);
      throw new Error(`Failed to upload to Supabase Storage: ${uploadError.message}`);
    }

    // C. Get Public URL
    const { data: publicUrlData } = supabaseClient
      .storage
      .from('story-assets')
      .getPublicUrl(fileName);

    const finalUrl = publicUrlData.publicUrl;
    console.log("✅ Image persisted at:", finalUrl);

    return new Response(
      JSON.stringify({ imageUrl: finalUrl, usedSeed }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    console.error("❌ CRITICAL FUNCTION ERROR:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500 // Vracíme 500, ale s CORS, takže frontend to přečte
    });
  }
})