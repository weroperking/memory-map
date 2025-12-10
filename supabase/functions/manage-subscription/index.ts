import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: 'Server not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const authHeader = req.headers.get('authorization') || '';
    const userToken = authHeader.replace('Bearer ', '');
    if (!userToken) {
      return new Response(JSON.stringify({ error: 'Missing user authentication token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Validate the user token and get user id
    const { data: userData, error: userErr } = await admin.auth.getUser(userToken);
    if (userErr || !userData.user) {
      console.error('auth.getUser error', userErr);
      return new Response(JSON.stringify({ error: 'Invalid user token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const userId = userData.user.id;

    const payload = await req.json();
    const action = payload.action;
    const body = payload.data;

    if (!action) {
      return new Response(JSON.stringify({ error: 'Missing action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'create') {
      // Ensure server-side only: we will perform the insert with service role key.
      // Attach the user_id from the validated token to the record.
      const record = { ...body, user_id: userId };
      const { data, error } = await admin.from('subscriptions').insert(record).select();
      if (error) {
        console.error('insert error', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      return new Response(JSON.stringify({ data }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'update') {
      const id = body?.id;
      if (!id) return new Response(JSON.stringify({ error: 'Missing id for update' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      // Verify the subscription belongs to the user
      const { data: existing, error: fetchErr } = await admin.from('subscriptions').select('user_id').eq('id', id).single();
      if (fetchErr) {
        console.error('fetch subscription error', fetchErr);
        return new Response(JSON.stringify({ error: 'Unable to fetch subscription' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      if (!existing || existing.user_id !== userId) {
        return new Response(JSON.stringify({ error: 'Not authorized to modify this subscription' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const updates = { ...body };
      delete updates.id;

      const { data, error } = await admin.from('subscriptions').update(updates).eq('id', id).select();
      if (error) {
        console.error('update error', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      return new Response(JSON.stringify({ data }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'delete') {
      const id = body?.id;
      if (!id) return new Response(JSON.stringify({ error: 'Missing id for delete' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      const { data: existing, error: fetchErr } = await admin.from('subscriptions').select('user_id').eq('id', id).single();
      if (fetchErr) {
        console.error('fetch subscription error', fetchErr);
        return new Response(JSON.stringify({ error: 'Unable to fetch subscription' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      if (!existing || existing.user_id !== userId) {
        return new Response(JSON.stringify({ error: 'Not authorized to delete this subscription' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const { data, error } = await admin.from('subscriptions').delete().eq('id', id).select();
      if (error) {
        console.error('delete error', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      return new Response(JSON.stringify({ data }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error in manage-subscription:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
