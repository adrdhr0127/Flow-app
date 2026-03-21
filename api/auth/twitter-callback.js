/**
 * /api/auth/twitter-callback.js — Step 2: Exchange code, save token, close popup
 */
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const close = (res, type, data) => res.send(`<script>window.opener?.postMessage(${JSON.stringify({type,...data})},'*');window.close();</script>`);

export default async function handler(req, res) {
  const { code, state: userId, error } = req.query;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${req.headers.host}`;
  if (error || !code) return close(res, 'oauth_error', { message: error || 'No code' });
  const verifier = req.cookies?.tw_verifier;
  if (!verifier) return close(res, 'oauth_error', { message: 'Session expired' });
  try {
    const creds = Buffer.from(`${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`).toString('base64');
    const t = await (await fetch('https://api.twitter.com/2/oauth2/token', { method:'POST', headers:{'Authorization':`Basic ${creds}`,'Content-Type':'application/x-www-form-urlencoded'}, body:new URLSearchParams({code,grant_type:'authorization_code',redirect_uri:`${appUrl}/api/auth/twitter-callback`,code_verifier:verifier}) })).json();
    if (!t.access_token) return close(res, 'oauth_error', { message: 'Token exchange failed' });
    const u = await (await fetch('https://api.twitter.com/2/users/me?user.fields=public_metrics', { headers:{'Authorization':`Bearer ${t.access_token}`} })).json();
    const tw = u.data;
    await supabase.from('platform_connections').upsert({ user_id:userId, platform:'tw', username:tw?.username||'', platform_user_id:tw?.id||'', access_token:t.access_token, refresh_token:t.refresh_token||null, connected_at:new Date().toISOString() }, { onConflict:'user_id,platform' });
    return close(res, 'oauth_success', { platform:'tw', username:tw?.username||'' });
  } catch(e) { return close(res, 'oauth_error', { message: e.message }); }
}
