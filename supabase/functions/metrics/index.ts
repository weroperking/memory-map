import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE');
    if (!SUPABASE_URL || !SERVICE_ROLE) {
      return new Response(JSON.stringify({ error: 'Supabase env variables not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Compute start of today (UTC)
    const now = new Date();
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0,0,0));
    const startISO = start.toISOString();

    const headers = {
      'apikey': SERVICE_ROLE,
      'Authorization': `Bearer ${SERVICE_ROLE}`,
      'Content-Type': 'application/json'
    };

    // Fetch activity logs for today
    const alRes = await fetch(`${SUPABASE_URL}/rest/v1/activity_logs?select=user_id,action,created_at&created_at=gte.${encodeURIComponent(startISO)}`, { headers });
    const activityRows = alRes.ok ? await alRes.json() : [];

    const dau = new Set((activityRows || []).map((r: any) => r.user_id)).size;
    const totalActions = (activityRows || []).length;
    const photoUploads = (activityRows || []).filter((r: any) => r.action === 'photo_upload').length;

    // Subscriptions active
    const subRes = await fetch(`${SUPABASE_URL}/rest/v1/subscriptions?select=id&status=eq.active`, { headers });
    const activeSubs = subRes.ok ? (await subRes.json()).length : 0;

    // Errors today
    const errRes = await fetch(`${SUPABASE_URL}/rest/v1/error_logs?select=id&created_at=gte.${encodeURIComponent(startISO)}`, { headers });
    const errorCount = errRes.ok ? (await errRes.json()).length : 0;

    const errorRatePercent = totalActions > 0 ? (errorCount / totalActions) * 100 : 0;

    // Storage usage: sum storage_usage.total_bytes where >0
    const storageRes = await fetch(`${SUPABASE_URL}/rest/v1/storage_usage?select=total_bytes`, { headers });
    const storageRows = storageRes.ok ? await storageRes.json() : [];
    const totalStorageBytes = (storageRows || []).reduce((sum: number, r: any) => sum + (Number(r.total_bytes) || 0), 0);
    const storageUsedGB = totalStorageBytes / (1024 ** 3);

    // Prepare metrics to insert
    const metrics = [
      { metric_type: 'daily_active_users', metric_value: dau, tags: { period: 'day' }, created_at: new Date().toISOString() },
      { metric_type: 'photos_uploaded_daily', metric_value: photoUploads, tags: { period: 'day' }, created_at: new Date().toISOString() },
      { metric_type: 'subscriptions_active', metric_value: activeSubs, tags: { period: 'day' }, created_at: new Date().toISOString() },
      { metric_type: 'error_rate_percent', metric_value: Number(errorRatePercent.toFixed(4)), tags: { period: 'day' }, created_at: new Date().toISOString() },
      { metric_type: 'storage_used_gb', metric_value: Number(storageUsedGB.toFixed(4)), tags: { unit: 'gb' }, created_at: new Date().toISOString() },
    ];

    // Insert metrics
    const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/app_metrics`, {
      method: 'POST',
      headers: { ...headers, Prefer: 'return=representation' },
      body: JSON.stringify(metrics),
    });

    if (!insertRes.ok) {
      const text = await insertRes.text();
      console.error('Failed to insert metrics:', insertRes.status, text);
      return new Response(JSON.stringify({ error: 'Failed to insert metrics', detail: text }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ ok: true, metricsInserted: metrics.length }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error in metrics function:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
