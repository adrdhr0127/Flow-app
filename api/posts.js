/**
 * /api/posts.js  —  Full CRUD for scheduled posts
 * GET    /api/posts          → list all posts for authenticated user
 * POST   /api/posts          → create a post
 * PUT    /api/posts          → update a post (pass id in body)
 * DELETE /api/posts          → delete a post (pass id in body)
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
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized — please sign in.' });

  // ── GET — list all posts ordered by schedule date ──────────────────────────
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', user.id)
      .order('scheduled_at', { ascending: true, nullsFirst: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  // ── POST — create post ─────────────────────────────────────────────────────
  if (req.method === 'POST') {
    const { caption, platforms, hashtags, scheduled_at, status, notes } = req.body;
    if (!caption) return res.status(400).json({ error: 'caption is required' });
    const { data, error } = await supabase
      .from('posts')
      .insert({
        user_id: user.id,
        caption,
        platforms: platforms || [],
        hashtags:  hashtags  || [],
        scheduled_at: scheduled_at || null,
        status: status || 'draft',
        notes:  notes  || null,
      })
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  // ── PUT — update post ──────────────────────────────────────────────────────
  if (req.method === 'PUT') {
    const { id, ...updates } = req.body;
    if (!id) return res.status(400).json({ error: 'id is required' });
    // Remove read-only fields
    delete updates.user_id; delete updates.created_at; delete updates.id;
    const { data, error } = await supabase
      .from('posts')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  // ── DELETE — remove post ───────────────────────────────────────────────────
  if (req.method === 'DELETE') {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'id is required' });
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
