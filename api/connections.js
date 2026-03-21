/**
 * /api/connections.js
 * CRUD for platform OAuth/manual token connections per user.
 * GET    — list all connections (tokens masked)
 * POST   — save/update a connection (manual token or OAuth callback)
 * DELETE — remove a connection
 */
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getUser(req) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return null;
  const { data: { user } } = await supabase.auth.getUser(token);
  return user || null;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  // GET — list connections (never return raw tokens to client)
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('platform_connections')
      .select('platform, username, platform_user_id, connected_at')
      .eq('user_id', user.id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data || []);
  }

  // POST — save manual token or OAuth result
  if (req.method === 'POST') {
    const { platform, access_token, refresh_token, username, platform_user_id, method } = req.body;
    if (!platform) return res.status(400).json({ error: 'platform is required' });

    const { error } = await supabase
      .from('platform_connections')
      .upsert({
        user_id: user.id,
        platform,
        username: username || null,
        platform_user_id: platform_user_id || null,
        access_token: access_token || null,
        refresh_token: refresh_token || null,
        connected_at: new Date().toISOString(),
      }, { onConflict: 'user_id,platform' });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  // DELETE — disconnect platform
  if (req.method === 'DELETE') {
    const { platform } = req.body;
    if (!platform) return res.status(400).json({ error: 'platform is required' });
    const { error } = await supabase
      .from('platform_connections')
      .delete()
      .eq('user_id', user.id)
      .eq('platform', platform);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
