
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
    const { prompt, mode, user_id, image_prompt } = body;
    // mode: 'sticker' | 'background'

    if (!prompt) throw new Error("Missing prompt");

    console.log(`🎨 Skywhale Flux Request. Mode: ${mode}, User: ${user_id}, Ref: ${image_prompt ? 'YES' : 'NO'}`);

    // Select Model & Param Tuning
    // STICKER ENGINE UPDATE: Using FLUX 1 DEV for economy/speed (Sufficient for stickers)
    const MODEL_VERSION = "black-forest-labs/flux-dev"; 
    // Schnell is faster/cheaper for interactive sticker use. Pro/Dev for quality.
    
    let modifiedPrompt = prompt;
    if (mode === 'sticker') {
        modifiedPrompt = `solo separated sticker of ${prompt}, white background, high quality, vector style, cute, simple, clean edges, centered`;
    } else if (mode === 'background') {
        modifiedPrompt = `atmospheric background texture of ${prompt}, magical world, soft lighting, no characters, seamless, detailed, 8k, fantasy art`;
    }

    const inputPayload: any = {
      prompt: modifiedPrompt,
      aspect_ratio: mode === 'background' ? "3:4" : "1:1", // Portrait for backgrounds, Square for stickers
      output_format: "webp",
      go_fast: true // Optimization for latency
    };

    if (image_prompt) {
        inputPayload.image_prompt = image_prompt;
    }

    console.log(`🚀 Sending to Replicate: ${MODEL_VERSION}`);
    
    // Call Replicate
    // Note: In production we might use an official SDK, but fetch is fine for Edge.
    // We need to resolve version ID if we want specific pinning, but simpler to use the named model endpoint if available or just raw predictions.
    // Standard pattern: GET model -> get version -> POST prediction. 
    // For Schnell we can often just POST to deployments if set up, but let's stick to the proven pattern from previous function.

    // 1. Get Model Version (Caching this would be good in prod)
    // Actually, for flux-schnell we can use the strict version ID or specific endpoint. 
    // Let's use the generic endpoint which helps avoid version maintenance.
    // 'replicate/flux-schnell' (or owner/name)
    const modelResponse = await fetch(`https://api.replicate.com/v1/models/${MODEL_VERSION}`, {
        headers: { "Authorization": `Token ${Deno.env.get('REPLICATE_API_TOKEN')}` }
    });
    
    if (!modelResponse.ok) {
        throw new Error(`Model fetch failed: ${modelResponse.status}`);
    }
    const modelData = await modelResponse.json();
    const latestVersionId = modelData.latest_version?.id;

    if (!latestVersionId) throw new Error("Latest version not found");

    // 2. Create Prediction
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${Deno.env.get('REPLICATE_API_TOKEN')}`,
        "Content-Type": "application/json",
        "Prefer": "wait=30" // Wait for result
      },
      body: JSON.stringify({
        version: latestVersionId,
        input: inputPayload
      }),
    });

    let prediction = await response.json();

    if (!response.ok) {
        throw new Error(`Replicate API Error (${response.status}): ${JSON.stringify(prediction)}`);
    }

    // If initially processing/starting, poll until done
    let attempts = 0;
    while (prediction.status !== 'succeeded' && prediction.status !== 'failed' && prediction.status !== 'canceled') {
        attempts++;
        if (attempts > 40) { 
             throw new Error("Generation timed out (polling limit reached)");
        }

        // Wait 1s
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Refetch
        const pollUrl = prediction.urls?.get;
        if (!pollUrl) {
            // Unexpected state: processing but no polling URL?
            throw new Error(`No polling URL provided. State: ${JSON.stringify(prediction)}`);
        }

        const pollResponse = await fetch(pollUrl, {
            headers: {
                 "Authorization": `Token ${Deno.env.get('REPLICATE_API_TOKEN')}`,
            }
        });
        prediction = await pollResponse.json();
    }

    if (prediction.status === 'failed' || prediction.status === 'canceled') {
         throw new Error(`Generation failed: ${prediction.error || prediction.status}`);
    }

    const replicateUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
    
    if (!replicateUrl) {
         throw new Error(`No URL returned. Status: ${prediction.status}. Debug Output: ${JSON.stringify(prediction.output)}`);
    }

    // 3. Return Replicate URL directly (Avoids storage bucket issues for temp stickers)
    return new Response(
      JSON.stringify({ imageUrl: replicateUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

    // Select Model: Flux Schnell (Hardcoded hash for stability)
    // Using the ID from process-story-image to match known working config
    const MODEL_VERSION_ID = "5b518c761e08542c3809618175b9589d38c641d4016f4460d6911c471444585c"; 
    // ^ This is Flux 1.1 Pro? Or Schnell? 
    // process-story-image had: 970b... -> This is Flux-Schnell. Let's use that.
    const CORRECT_HASH = "5b518c761e08542c3809618175b9589d38c641d4016f4460d6911c471444585c"; // Actually Replicate docs say standard Schnell is this? 
    // Let's stick to the Alias approach by changing the fetch to POST directly if we use the alias? No, alias needs lookup.
    // Let's use the explicit hash to avoid the lookup call which might be failing.
    
    // Using Flux Schnell Hash directly
    const FLUX_SCHNELL = "f22f73a3889a718cda15383f9828d8448f76dfd224d0840b08055a40a2ed511c"; // Wait, these change.
    // Let's use "black-forest-labs/flux-schnell" via the 'predictions' endpoint directly using `model` param if supported? No, Replicate uses versions.
    
    // Safer approach: DEBUG MODE - Return 200 with error.
    // I will leave the lookup for now, but inspect the error.

  } catch (error: any) {
    console.error("error:", error);
    // RETURN 200 to bypass client throwing, so we see the message
    return new Response(
      JSON.stringify({ error: `DEBUG: ${error.message || error.toString()}` }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    )
  }
})
