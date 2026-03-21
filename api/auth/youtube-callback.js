/**
 * /api/auth/youtube-callback.js — Step 2: Exchange code, save token
 */
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const close = (res, type, data) => res.send(`<script>window.opener?.postMessage(${JSON.stringify({type,...data})},'*');window.close();</script>`);

export default async function handler(req, res) {
  const { code, state: userId, error } = req.query;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${req.headers.host}`;
  if (error || !code) return close(res, 'oauth_error', { message: error || 'No code' });
  try {
    const t = await (await fetch('https://oauth2.googleapis.com/token', { method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'}, body:new URLSearchParams({code,client_id:process.env.YOUTUBE_CLIENT_ID,client_secret:process.env.YOUTUBE_CLIENT_SECRET,redirect_uri:`${appUrl}/api/auth/youtube-callback`,grant_type:'authorization_code'}) })).json();
    if (!t.access_token) return close(res, 'oauth_error', { message: 'Token exchange failed' });
    const ch = await (await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true', { headers:{'Authorization':`Bearer ${t.access_token}`} })).json();
    const channel = ch.items?.[0];
    const username = channel?.snippet?.title || '';
    const channelId = channel?.id || '';
    await supabase.from('platform_connections').upsert({ user_id:userId, platform:'yt', username, platform_user_id:channelId, access_token:t.access_token, refresh_token:t.refresh_token||null, connected_at:new Date().toISOString() }, { onConflict:'user_id,platform' });
    return close(res, 'oauth_success', { platform:'yt', username });
  } catch(e) { return close(res, 'oauth_error', { message: e.message }); }
}
