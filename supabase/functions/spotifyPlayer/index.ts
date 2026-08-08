import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const body = await req.json();
    const { action, access_token, device_id, context_uri, uris } = body;

    const headers = {
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json',
    };

    const json = (data: unknown, status = 200) =>
      new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    if (action === 'get_playlists') {
      const res = await fetch('https://api.spotify.com/v1/me/playlists?limit=20', { headers });
      const data = await res.json();
      return json({ playlists: data.items || [] });
    }

    if (action === 'get_playback_state') {
      const res = await fetch('https://api.spotify.com/v1/me/player', { headers });
      if (res.status === 204) return json({ playback: null });
      const data = await res.json();
      return json({ playback: data });
    }

    if (action === 'get_devices') {
      const res = await fetch('https://api.spotify.com/v1/me/player/devices', { headers });
      if (res.status === 401 || res.status === 403) {
        return json({ error: 'token_expired', devices: [] });
      }
      const data = await res.json();
      return json({ devices: data.devices || [] });
    }

    if (action === 'transfer_playback') {
      const { target_device_id } = body;
      await fetch('https://api.spotify.com/v1/me/player', {
        method: 'PUT', headers,
        body: JSON.stringify({ device_ids: [target_device_id], play: true }),
      });
      return json({ success: true });
    }

    if (action === 'play') {
      let targetDevice = device_id;
      if (!targetDevice) {
        const devRes = await fetch('https://api.spotify.com/v1/me/player/devices', { headers });
        const devData = await devRes.json();
        const devices = devData.devices || [];
        const active = devices.find((d: any) => d.is_active) || devices[0];
        if (active) targetDevice = active.id;
      }

      const params = targetDevice ? `?device_id=${targetDevice}` : '';
      const bodyData: Record<string, unknown> = {};
      if (context_uri) bodyData.context_uri = context_uri;
      if (uris) bodyData.uris = uris;
      if (body.position_ms !== undefined) bodyData.position_ms = body.position_ms;

      const playRes = await fetch(`https://api.spotify.com/v1/me/player/play${params}`, {
        method: 'PUT', headers, body: JSON.stringify(bodyData),
      });

      if (!playRes.ok) {
        const err = await playRes.json().catch(() => ({}));
        return json({ success: false, error: (err as any)?.error?.message || 'Playback failed' });
      }
      return json({ success: true });
    }

    if (action === 'pause') {
      await fetch('https://api.spotify.com/v1/me/player/pause', { method: 'PUT', headers });
      return json({ success: true });
    }

    if (action === 'next') {
      await fetch('https://api.spotify.com/v1/me/player/next', { method: 'POST', headers });
      return json({ success: true });
    }

    if (action === 'previous') {
      await fetch('https://api.spotify.com/v1/me/player/previous', { method: 'POST', headers });
      return json({ success: true });
    }

    if (action === 'set_volume') {
      const { volume_percent } = body;
      await fetch(`https://api.spotify.com/v1/me/player/volume?volume_percent=${volume_percent}`, { method: 'PUT', headers });
      return json({ success: true });
    }

    if (action === 'set_shuffle') {
      const { state } = body;
      await fetch(`https://api.spotify.com/v1/me/player/shuffle?state=${state}`, { method: 'PUT', headers });
      return json({ success: true });
    }

    if (action === 'set_repeat') {
      const { state } = body;
      await fetch(`https://api.spotify.com/v1/me/player/repeat?state=${state}`, { method: 'PUT', headers });
      return json({ success: true });
    }

    return json({ error: 'Invalid action' }, 400);
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
