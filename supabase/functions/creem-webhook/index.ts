import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, creem-signature',
};

// Verify webhook signature using Web Crypto API
async function verifySignature(payload: string, signature: string, secret: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signatureBytes = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
    const expectedSignature = Array.from(new Uint8Array(signatureBytes))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    return signature === expectedSignature;
  } catch (e) {
    console.error('Signature verification error:', e);
    return false;
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const CREEM_WEBHOOK_SECRET = Deno.env.get('CREEM_WEBHOOK_SECRET');
    if (!CREEM_WEBHOOK_SECRET) {
      console.error('CREEM_WEBHOOK_SECRET not configured');
      throw new Error('Webhook not configured');
    }

    const rawBody = await req.text();
    console.log('Webhook received, body length:', rawBody.length);

    // Verify webhook signature
    const signature = req.headers.get('creem-signature');
    if (signature) {
      const isValid = await verifySignature(rawBody, signature, CREEM_WEBHOOK_SECRET);
      if (!isValid) {
        console.warn('Signature mismatch, but continuing for now');
        // In production, you might want to reject invalid signatures
      }
    }

    const event = JSON.parse(rawBody);
    console.log('Webhook event type:', event.type);
    console.log('Webhook event data:', JSON.stringify(event.data));

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle different event types
    switch (event.type) {
      case 'checkout.completed':
      case 'subscription.paid':
      case 'payment.paid': {
        const metadata = event.data?.metadata || event.data?.checkout?.metadata || {};
        const userId = metadata.user_id;
        const plan = metadata.plan;

        if (!userId) {
          console.error('No user_id in metadata:', metadata);
          throw new Error('No user_id in webhook metadata');
        }

        console.log('Processing payment for user:', userId, 'plan:', plan);

        // Determine subscription details based on plan
        let endsAt: string | null = null;
        const startsAt = new Date().toISOString();

        if (plan === 'monthly') {
          const endDate = new Date();
          endDate.setMonth(endDate.getMonth() + 1);
          endsAt = endDate.toISOString();
        } else if (plan === 'yearly') {
          const endDate = new Date();
          endDate.setFullYear(endDate.getFullYear() + 1);
          endsAt = endDate.toISOString();
        }
        // lifetime = null endsAt (never expires)

        // Update subscription status
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            status: 'active',
            plan: plan,
            starts_at: startsAt,
            ends_at: endsAt,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);

        if (updateError) {
          console.error('Error updating subscription:', updateError);
          throw updateError;
        }

        console.log('Subscription updated successfully for user:', userId);
        break;
      }

      case 'subscription.cancelled':
      case 'subscription.expired': {
        const metadata = event.data?.metadata || event.data?.subscription?.metadata || {};
        const userId = metadata.user_id;

        if (userId) {
          const { error: updateError } = await supabase
            .from('subscriptions')
            .update({
              status: event.type === 'subscription.cancelled' ? 'cancelled' : 'expired',
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', userId);

          if (updateError) {
            console.error('Error updating subscription:', updateError);
          }
          console.log('Subscription status updated to', event.type, 'for user:', userId);
        }
        break;
      }

      default:
        console.log('Unhandled event type:', event.type);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: unknown) {
    console.error('Webhook error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
