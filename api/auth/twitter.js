/**
 * /api/auth/twitter.js — Twitter/X OAuth 2.0 PKCE — Step 1: Redirect
 * Required env vars: TWITTER_CLIENT_ID, NEXT_PUBLIC_APP_URL
 */
const { randomFillSync, createHash } = require('crypto');

function generateVerifier() {
  const arr = Buffer.alloc(32); randomFillSync(arr); return arr.toString('base64url');
}
function generateChallenge(v) { return createHash('sha256').update(v).digest('base64url'); }

export default async function handler(req, res) {
  const clientId = process.env.TWITTER_CLIENT_ID;
  const appUrl   = process.env.NEXT_PUBLIC_APP_URL || `https://${req.headers.host}`;
  if (!clientId) return res.send(`<script>window.opener?.postMessage({type:'oauth_error',message:'TWITTER_CLIENT_ID not set'},'*');window.close();</script>`);

  const verifier  = generateVerifier();
  const challenge = generateChallenge(verifier);
  const userId    = req.query.user_id || '';

  res.setHeader('Set-Cookie', `tw_verifier=${verifier}; HttpOnly; Path=/; Max-Age=600; SameSite=Lax`);
  const params = new URLSearchParams({ response_type:'code', client_id:clientId, redirect_uri:`${appUrl}/api/auth/twitter-callback`, scope:'tweet.read users.read offline.access', state:userId, code_challenge:challenge, code_challenge_method:'S256' });
  return res.redirect(`https://twitter.com/i/oauth2/authorize?${params}`);
}
