import { serve } from "https://deno.land/std@0.192.0/http/server.ts"
import Stripe from 'https://esm.sh/stripe@13.10.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2022-11-15',
  httpClient: Stripe.createFetchHttpClient(),
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PACKAGES = {
  // One-time (10x Inflation & Price Adjustments)
  'starter': { price_id: 'price_STARTER', amount: 19900, energy: 1000, name: 'Zvědavec (1000 Energy)', mode: 'payment' },
  'writer': { price_id: 'price_WRITER', amount: 49900, energy: 3000, name: 'Spisovatel (3000 Energy)', mode: 'payment' },
  'master_wordsmith': { price_id: 'price_MASTER', amount: 109900, energy: 7500, name: 'Mistr Slova (7500 Energy)', mode: 'payment' },
  
  // Monthly Subscriptions (10x Inflation)
  'sub_monthly_start': { amount: 25900, energy: 1600, name: 'Start Měsíční (1600 Energy)', mode: 'subscription', interval: 'month' },
  'sub_monthly_advanced': { amount: 59900, energy: 4000, name: 'Pokročilý Měsíční (4000 Energy)', mode: 'subscription', interval: 'month' },
  'sub_monthly_expert': { amount: 119900, energy: 9000, name: 'Expert Měsíční (9000 Energy)', mode: 'subscription', interval: 'month' },
  'sub_monthly_master': { amount: 249900, energy: 21000, name: 'Mistr Měsíční (21000 Energy)', mode: 'subscription', interval: 'month' },

  // Yearly Subscriptions (10x Inflation)
  'sub_yearly_start': { amount: 310800, energy: 19200, name: 'Start Roční (19200 Energy)', mode: 'subscription', interval: 'year' },
  'sub_yearly_advanced': { amount: 718800, energy: 48000, name: 'Pokročilý Roční (48000 Energy)', mode: 'subscription', interval: 'year' },
  'sub_yearly_expert': { amount: 1318900, energy: 108000, name: 'Expert Roční (108000 Energy)', mode: 'subscription', interval: 'year' },
  'sub_yearly_master': { amount: 2499000, energy: 252000, name: 'Mistr Roční (252000 Energy)', mode: 'subscription', interval: 'year' },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const debug_trace: string[] = ["Init"];

  try {
    debug_trace.push("Imports Loaded. Reading Body...");
    const { packageId, userId, successUrl, cancelUrl, customAmount } = await req.json()
    debug_trace.push(`Body Read. Package: ${packageId}, User: ${userId}`);

    let pkg;
    let unitAmount;
    let energyAmount;

    if (packageId === 'donate_custom') {
        const amount = Number(customAmount);
        if (!amount || amount < 20) throw new Error("Minimum donation is 20 CZK");
        
        unitAmount = Math.round(amount * 100); 
        energyAmount = Math.floor(amount * 5); 
        
        pkg = {
            name: `Dobrovolný Příspěvek (${energyAmount} Energy)`,
            amount: unitAmount,
            energy: energyAmount,
            mode: 'payment'
        };
    } else {
        pkg = PACKAGES[packageId as keyof typeof PACKAGES];
        if (!pkg) throw new Error("Invalid Package ID");
        unitAmount = pkg.amount;
        
        if (typeof packageId === 'string' && packageId.includes('_yearly_')) {
            energyAmount = Math.floor(pkg.energy / 12);
        } else {
            energyAmount = pkg.energy;
        }
    }
    
    debug_trace.push(`Package Resolved. Mode: ${pkg.mode}. Creating Session...`);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'czk',
            product_data: {
              name: pkg.name,
              images: ['https://sky-whale.app/assets/energy_icon.png'], 
            },
            unit_amount: unitAmount,
            ...(pkg.mode === 'subscription' ? { recurring: { interval: (pkg as any).interval } } : {})
          },
          quantity: 1,
        },
      ],
      mode: pkg.mode, 
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      metadata: {
        user_id: userId,
        energy_amount: energyAmount,
        package_id: packageId,
        type: pkg.mode
      },
      ...(pkg.mode === 'subscription' ? {
        subscription_data: {
          metadata: {
            user_id: userId,
            energy_amount: energyAmount,
            package_id: packageId,
            type: pkg.mode
          }
        }
      } : {}),
      client_reference_id: userId,
    });

    debug_trace.push("Session Created: " + session.id);

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    )
  } catch (error: any) {
    console.error("Critical Error", error);
    return new Response(
      JSON.stringify({ error: error.message, debug_trace: debug_trace }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    )
  }
})
