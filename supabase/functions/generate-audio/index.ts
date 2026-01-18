import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { bookId, text, voiceId } = await req.json()

    if (!bookId || !text) {
      throw new Error('Missing bookId or text')
    }

    // 1. Create Supabase Client to check Auth
    const authHeader = req.headers.get('Authorization')
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader! } } }
    )

    // 2. Get User
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()

    if (authError || !user) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Unauthorized', 
        details: authError?.message || 'No user found'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 3. Service Role Client for Admin actions (Energy deduct, Storage upload)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 4. Calculate Logic & Cost
    // Cost: 1 Energy per 20 characters
    // Example: 200 chars = 10 Energy, 600 chars = 30 Energy
    const cost = Math.max(1, Math.ceil(text.length / 20));

    // 5. Check Profile Energy
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('energy_balance')
      .eq('id', user.id)
      .single()
    
    if (profileError || !profile) throw new Error('Profile not found')
    
    if (profile.energy_balance < cost) {
      return new Response(JSON.stringify({ 
        error: 'Not enough energy', 
        required: cost, 
        current: profile.energy_balance 
      }), {
        status: 402,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 6. Deduct Energy
    const { error: deductError } = await supabaseAdmin
      .from('profiles')
      .update({ energy_balance: profile.energy_balance - cost })
      .eq('id', user.id)
    
    if (deductError) throw new Error('Failed to deduct energy')

    // 7. Call ElevenLabs API
    const ELEVEN_LABS_API_KEY = Deno.env.get('ELEVEN_LABS_API_KEY')
    if (!ELEVEN_LABS_API_KEY) {
        throw new Error('Server configuration error: Missing API Key')
    }

    // Voice ID Logic
    // Default: "21m00Tcm4TlvDq8ikWAM" (Rachel/Laskavá teta)
    // If voiceId is provided, use it.
    const VOICE_ID = voiceId || "21m00Tcm4TlvDq8ikWAM"; 

    // Settings for Slower Pace:
    // Higher stability forces the model to be more consistent -> often slower/clearer.
    const voiceSettings = {
        stability: 0.75, // Increased from 0.5 for slower, steadier pace
        similarity_boost: 0.75,
        use_speaker_boost: true
    };

    const elevenResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVEN_LABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: voiceSettings
      })
    })

    if (!elevenResponse.ok) {
        const errText = await elevenResponse.text()
        throw new Error(`ElevenLabs error: ${errText}`)
    }

    const audioArrayBuffer = await elevenResponse.arrayBuffer()

    // 8. Upload to Storage
    const fileName = `${user.id}/${bookId}.mp3`
    const { error: uploadError } = await supabaseAdmin
      .storage
      .from('audio-books')
      .upload(fileName, audioArrayBuffer, {
        contentType: 'audio/mpeg',
        upsert: true
      })

    if (uploadError) throw uploadError

    // 9. Get Public URL
    const { data: { publicUrl } } = supabaseAdmin
      .storage
      .from('audio-books')
      .getPublicUrl(fileName)

    // 10. Update Book Record
    const { error: updateError } = await supabaseAdmin
      .from('books')
      .update({ 
          audio_url: publicUrl,
          voice_id: VOICE_ID // Store which voice was used
      })
      .eq('id', bookId)

    if (updateError) throw updateError

    return new Response(JSON.stringify({ 
      success: true, 
      audioUrl: publicUrl,
      energyCost: cost,
      remainingEnergy: profile.energy_balance - cost
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
