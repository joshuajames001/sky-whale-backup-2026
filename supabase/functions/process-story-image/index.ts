import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// CORS hlavičky jsou nutné, aby tvoje webová aplikace mohla funkci volat přímo
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Ošetření "preflight" požadavku prohlížeče
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Přijetí dat z tvého webu (Reactu)
    const { prompt, image_prompt_url, seed } = await req.json();

    // 2. Sestavení "Trojitého zámku" (DNA + IP-Adapter + Seed)
    const input = {
      prompt: prompt,                         // Textový popis scény a DNA
      image_prompt: image_prompt_url,         // URL obálky (vizuální předloha)
      seed: seed ? Number(seed) : undefined,  // Fixní seed pro stabilitu postavy
      aspect_ratio: "16:9",
      guidance: 3.5,
      output_format: "webp"
    };

    // 3. Volání Replicate API
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${Deno.env.get('REPLICATE_API_TOKEN')}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // Tady je ID modelu Flux.1 (Schnell nebo Dev)
        version: "970b97a9f63357048757008594248408cf896c21e3549646b107e383457b0196", 
        input: input
      }),
    });

    const prediction = await response.json();

    // 4. Pokud Replicate vrací chybu hned na začátku
    if (prediction.error) throw new Error(prediction.error);

    // Poznámka: Replicate vrací prediction objekt. U některých modelů 
    // je výsledek v prediction.output, u jiných je nutné na výsledek počkat.
    // Pro zjednodušení vracíme celou predikci.
    return new Response(
      JSON.stringify({ 
        predictionId: prediction.id,
        imageUrl: prediction.output?.[0] || null, // U Fluxu je to často pole
        usedSeed: prediction.seed 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500 
    });
  }
})