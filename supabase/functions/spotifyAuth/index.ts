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
    const { action, code, redirect_uri, refresh_token } = body;

    const clientId = Deno.env.get('SPOTIFY_CLIENT_ID')!;
    const clientSecret = Deno.env.get('SPOTIFY_CLIENT_SECRET')!;

    if (action === 'get_auth_url') {
      const scopes = [
        'streaming',
        'user-read-email',
        'user-read-private',
        'user-read-playback-state',
        'user-modify-playback-state',
        'playlist-read-private',
        'playlist-read-collaborative',
      ].join(' ');

      const params = new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        scope: scopes,
        redirect_uri,
        state: user.id,
      });

      return new Response(
        JSON.stringify({ auth_url: `https://accounts.spotify.com/authorize?${params.toString()}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'exchange_code') {
      const credentials = btoa(`${clientId}:${clientSecret}`);
      const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri }),
      });

      const tokenData = await tokenRes.json();
      if (tokenData.error) {
        return new Response(JSON.stringify({ error: tokenData.error_description }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_in: tokenData.expires_in,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'refresh_token') {
      const credentials = btoa(`${clientId}:${clientSecret}`);
      const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token }),
      });

      const tokenData = await tokenRes.json();
      if (tokenData.error) {
        return new Response(JSON.stringify({ error: tokenData.error_description }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({
        access_token: tokenData.access_token,
        expires_in: tokenData.expires_in,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
