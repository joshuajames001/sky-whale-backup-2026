import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Initialize Stripe
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2022-11-15',
  httpClient: Stripe.createFetchHttpClient(),
})

// Initialize Supabase Admin Client (needed to write to profiles/transactions regardless of RLS)
const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

serve(async (req) => {
  const signature = req.headers.get('Stripe-Signature')

  if (!signature) {
    return new Response('No signature', { status: 400 })
  }

  try {
    const body = await req.text()
    // Verify Webhook Signature
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '' 
    )

    // HANDLE INITIAL PAYMENT (Checkout Session)
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const userId = session.metadata?.user_id;
        const fullEnergyAmount = Number(session.metadata?.energy_amount);
        const packageId = session.metadata?.package_id;

        if (userId && fullEnergyAmount) {
            console.log(`💰 Payment Success for User ${userId}. Package: ${packageId}`);
            
            let energyToGrant = fullEnergyAmount;
            let isYearlySub = false;
            let monthlyAllowance = 0;

            // CHECK IF YEARLY SUBSCRIPTION
            if (packageId && packageId.includes('_yearly_')) {
                isYearlySub = true;
                // ENERGY FIX: create-checkout now sends the MONTHLY portion in metadata.
                // So we do NOT need to divide by 12 here anymore.
                // energyToGrant = Math.floor(fullEnergyAmount / 12); 
                energyToGrant = fullEnergyAmount; 
                monthlyAllowance = fullEnergyAmount;
                console.log(`📅 Yearly Subscription Detected! Granting 1st month (${energyToGrant}) and setting allowance.`);
            }

            // 1. Log Transaction
            await supabaseAdmin.from('transactions').insert({
                user_id: userId,
                stripe_session_id: session.id,
                amount_czk: session.amount_total ? session.amount_total / 100 : 0,
                energy_amount: energyToGrant, // Log only what was actually granted
                package_id: packageId,
                status: 'completed'
            });

            // 2. Add Energy
            const { error } = await supabaseAdmin.rpc('add_energy', {
                p_user_id: userId,
                p_amount: energyToGrant
            });

            if (error) {
                console.error("❌ Failed to add energy:", error);
                throw error;
            }

            // 3. Update Subscription Profile (If Yearly)
            if (isYearlySub) {
                const nextGrant = new Date();
                nextGrant.setMonth(nextGrant.getMonth() + 1); // Next grant in 1 month

                await supabaseAdmin.from('profiles').update({
                    subscription_status: 'active',
                    subscription_tier: packageId,
                    energy_allowance: monthlyAllowance,
                    next_energy_grant: nextGrant.toISOString()
                }).eq('id', userId);
            }

            // 4. Unlock Achievements
            await checkRechargeAchievements(userId);
        }
    }

    // HANDLE RECURRING SUBSCRIPTION PAYMENTS
    if (event.type === 'invoice.payment_succeeded') {
        const invoice = event.data.object;
        
        // Only process renewal payments (initial is handled by checkout.session.completed)
        if (invoice.billing_reason === 'subscription_cycle') {
            const subscriptionId = invoice.subscription;
            
            if (subscriptionId) {
                // Fetch subscription to get metadata
                const subscription = await stripe.subscriptions.retrieve(subscriptionId);
                const userId = subscription.metadata?.user_id;
                const energyAmount = Number(subscription.metadata?.energy_amount);
                
                if (userId && energyAmount) {
                     console.log(`🔄 Subscription Renewal: Adding ${energyAmount} Energy to User ${userId}`);
                     
                     await supabaseAdmin.from('transactions').insert({
                        user_id: userId,
                        stripe_session_id: invoice.id,
                        amount_czk: invoice.amount_paid ? invoice.amount_paid / 100 : 0,
                        energy_amount: energyAmount,
                        package_id: 'subscription_renewal',
                        status: 'completed'
                    });

                    await supabaseAdmin.rpc('add_energy', {
                        p_user_id: userId,
                        p_amount: energyAmount
                    });

                    // Unlock Achievements for renewals too
                    await checkRechargeAchievements(userId);
                }
            }
        }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 })

  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`)
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }
})

// --- HELPER: Achievement Logic ---
async function checkRechargeAchievements(userId: string) {
    try {
        // Get total recharge count
        const { count: rechargeCount } = await supabaseAdmin
            .from('transactions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('status', 'completed');

        const totalRecharges = rechargeCount || 0;

        const buyerAchievements = [];
        if (totalRecharges >= 1) buyerAchievements.push('first_recharge');
        if (totalRecharges >= 5) buyerAchievements.push('regular_customer');
        if (totalRecharges >= 15) buyerAchievements.push('big_investor');
        if (totalRecharges >= 30) buyerAchievements.push('energy_magnate');

        for (const achId of buyerAchievements) {
            await supabaseAdmin
                .from('user_achievements')
                .upsert(
                { user_id: userId, achievement_id: achId }, 
                { onConflict: 'user_id, achievement_id', ignoreDuplicates: true }
                );
        }

        // Unlock 'Recruiter' Achievements (Referrer)
        const { data: profile } = await supabaseAdmin.from('profiles').select('referred_by').eq('id', userId).single();
        
        if (profile?.referred_by) {
                // Only count distinct referred users who paid
                // We check this referrer's stats
                const referrerId = profile.referred_by;

                const { count: successfulReferrals } = await supabaseAdmin
                    .from('profiles')
                    .select('id, transactions!inner(id)', { count: 'exact', head: true })
                    .eq('referred_by', referrerId)
                    .eq('transactions.status', 'completed');
                
                const refCount = successfulReferrals || 0;

                const referrerAchievements = [];
                if (refCount >= 1) referrerAchievements.push('recruiter_novice');
                if (refCount >= 5) referrerAchievements.push('recruiter_pro');
                if (refCount >= 10) referrerAchievements.push('recruiter_elite');
                if (refCount >= 25) referrerAchievements.push('recruiter_legend');

                for (const achId of referrerAchievements) {
                await supabaseAdmin
                    .from('user_achievements')
                    .upsert(
                        { user_id: referrerId, achievement_id: achId }, 
                        { onConflict: 'user_id, achievement_id', ignoreDuplicates: true }
                    );
            }
        }

    } catch (achErr) {
        console.error("⚠️ Achievement Unlock Failed:", achErr);
    }
}
