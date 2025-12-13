import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CREEM_API_URL = 'https://api.creem.io/v1';

const PRODUCT_IDS: Record<string, string> = {
  monthly: 'prod_3m5CDQMDWOSr5cXaSotspM',
  yearly: 'prod_1j2W3Q7MdtOVVeRnIcbAi3',
  lifetime: 'prod_34t9UTNyo04W74sFaa0dEb',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const CREEM_API_KEY = Deno.env.get('CREEM_API_KEY');
    if (!CREEM_API_KEY) {
      console.error('CREEM_API_KEY not configured');
      throw new Error('Payment system not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Not authenticated');
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError);
      throw new Error('Not authenticated');
    }

    const { plan } = await req.json();
    console.log('Checkout request for plan:', plan, 'user:', user.id);

    const productId = PRODUCT_IDS[plan?.toLowerCase()];
    if (!productId) {
      throw new Error('Invalid plan selected');
    }

    // Get origin for redirect URLs
    const origin = req.headers.get('origin') || 'https://guutofptiuhxvpazpdyp.supabase.co';

    // Create Creem checkout session
    const checkoutPayload = {
      product_id: productId,
      success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/payment-failed`,
      metadata: {
        user_id: user.id,
        user_email: user.email,
        plan: plan.toLowerCase(),
      },
      customer: {
        email: user.email,
      },
    };

    console.log('Creating Creem checkout with payload:', JSON.stringify(checkoutPayload));

    const response = await fetch(`${CREEM_API_URL}/checkouts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CREEM_API_KEY,
      },
      body: JSON.stringify(checkoutPayload),
    });

    const responseText = await response.text();
    console.log('Creem API response status:', response.status);
    console.log('Creem API response:', responseText);

    if (!response.ok) {
      throw new Error(`Creem API error: ${responseText}`);
    }

    const checkoutData = JSON.parse(responseText);
    console.log('Checkout session created:', checkoutData.id);

    return new Response(
      JSON.stringify({ 
        checkoutUrl: checkoutData.checkout_url,
        sessionId: checkoutData.id 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: unknown) {
    console.error('Checkout error:', error);
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
