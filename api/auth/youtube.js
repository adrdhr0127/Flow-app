/**
 * /api/auth/youtube.js — Google/YouTube OAuth 2.0 — Step 1: Redirect
 * Required env vars: YOUTUBE_CLIENT_ID, NEXT_PUBLIC_APP_URL
 */
export default function handler(req, res) {
  const clientId = process.env.YOUTUBE_CLIENT_ID;
  const appUrl   = process.env.NEXT_PUBLIC_APP_URL || `https://${req.headers.host}`;
  if (!clientId) return res.send(`<script>window.opener?.postMessage({type:'oauth_error',message:'YOUTUBE_CLIENT_ID not set'},'*');window.close();</script>`);
  const params = new URLSearchParams({ client_id:clientId, redirect_uri:`${appUrl}/api/auth/youtube-callback`, response_type:'code', scope:'https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/yt-analytics.readonly', access_type:'offline', prompt:'consent', state:req.query.user_id||'' });
  return res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
}
