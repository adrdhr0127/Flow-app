/**
 * /api/analytics.js
 * Returns per-user analytics across all 7 platforms.
 * Uses deterministic user-seeded demo data as the baseline.
 * Any manually-stored snapshots in Supabase are merged on top.
 * Replace the demo generators with real API calls once you have OAuth tokens.
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

// Deterministic seed from user ID so each user gets consistent "personal" data
function seedFromId(id) {
  let h = 0;
  for (const c of (id || 'demo')) { h = ((h << 5) - h) + c.charCodeAt(0); h |= 0; }
  return Math.abs(h);
}

function generateHistory(seed, base, variance, days = 30) {
  const points = [];
  let val = base;
  for (let i = days; i >= 0; i--) {
    const date = new Date(); date.setDate(date.getDate() - i);
    val += Math.floor(((seed * (i + 1)) % variance) - variance / 3);
    val = Math.max(val, Math.floor(base * 0.6));
    points.push({ date: date.toISOString().split('T')[0], value: val });
  }
  return points;
}

function buildDemoData(userId) {
  const s = seedFromId(userId);
  const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  return {
    ig: {
      connected: true, username: 'your_brand',
      followers: 12000+(s%8000), following: 380+(s%200), posts_count: 290+(s%100),
      engagement_rate: +(3.2+(s%30)/10).toFixed(2),
      avg_likes: 480+(s%300), avg_comments: 18+(s%20), avg_shares: 42+(s%40), avg_saves: 90+(s%80),
      growth_7d: 80+(s%150), growth_30d: 320+(s%600),
      best_day: days[s%7], best_hour: `${6+(s%10)}:00 PM`, top_format: ['Reels','Carousels','Stories','Static'][s%4],
      history: generateHistory(s, 12000+(s%8000), 200),
    },
    tw: {
      connected: true, username: 'your_brand',
      followers: 8400+(s%5000), following: 290+(s%150), posts_count: 3100+(s%1000),
      engagement_rate: +(1.8+(s%20)/10).toFixed(2),
      avg_likes: 120+(s%100), avg_comments: 14+(s%15), avg_shares: 38+(s%50), avg_saves: 0,
      growth_7d: 55+(s%120), growth_30d: 210+(s%400),
      best_day: ['Monday','Wednesday','Friday'][s%3], best_hour: `${8+(s%6)}:00 AM`, top_format: ['Threads','Single tweets','Polls'][s%3],
      history: generateHistory(s+1, 8400+(s%5000), 150),
    },
    tk: {
      connected: false, username: '',
      followers: 4200+(s%3000), following: 110+(s%80), posts_count: 98+(s%60),
      engagement_rate: +(5.8+(s%40)/10).toFixed(2),
      avg_likes: 680+(s%500), avg_comments: 34+(s%30), avg_shares: 120+(s%100), avg_saves: 180+(s%120),
      growth_7d: 210+(s%400), growth_30d: 900+(s%1500),
      best_day: ['Thursday','Friday','Saturday'][s%3], best_hour: `${7+(s%4)}:00 PM`, top_format: ['Trending audio','Duets','Tutorials'][s%3],
      history: generateHistory(s+2, 4200+(s%3000), 300),
    },
    li: {
      connected: false, username: '',
      followers: 2100+(s%1500), following: 430+(s%200), posts_count: 180+(s%80),
      engagement_rate: +(2.4+(s%15)/10).toFixed(2),
      avg_likes: 98+(s%80), avg_comments: 22+(s%25), avg_shares: 18+(s%20), avg_saves: 0,
      growth_7d: 24+(s%60), growth_30d: 95+(s%200),
      best_day: ['Tuesday','Wednesday','Thursday'][s%3], best_hour: `${8+(s%3)}:00 AM`, top_format: ['Articles','Document posts','Text posts'][s%3],
      history: generateHistory(s+3, 2100+(s%1500), 80),
    },
    yt: {
      connected: false, username: '',
      followers: 18400+(s%12000), following: 0, posts_count: 94+(s%60),
      engagement_rate: +(4.1+(s%25)/10).toFixed(2),
      avg_likes: 820+(s%600), avg_comments: 65+(s%80), avg_shares: 180+(s%200), avg_saves: 0,
      avg_views: 12400+(s%18000), watch_time_hrs: 3200+(s%4800),
      growth_7d: 280+(s%400), growth_30d: 1100+(s%2000),
      best_day: ['Thursday','Friday'][s%2], best_hour: `${4+(s%4)}:00 PM`, top_format: ['Tutorials','Vlogs','Shorts'][s%3],
      history: generateHistory(s+4, 18400+(s%12000), 350),
    },
    fb: {
      connected: false, username: '',
      followers: 31600+(s%20000), following: 310+(s%100), posts_count: 218+(s%100),
      engagement_rate: +(1.4+(s%15)/10).toFixed(2),
      avg_likes: 310+(s%250), avg_comments: 28+(s%30), avg_shares: 95+(s%100), avg_saves: 0,
      page_reach: 18000+(s%42000), page_likes: Math.round((31600+(s%20000))*0.92),
      growth_7d: 120+(s%200), growth_30d: 480+(s%800),
      best_day: ['Wednesday','Thursday','Saturday'][s%3], best_hour: `${1+(s%3)}:00 PM`, top_format: ['Videos','Photos','Links'][s%3],
      history: generateHistory(s+5, 31600+(s%20000), 180),
    },
    sc: {
      connected: false, username: '',
      followers: 8900+(s%6000), following: 620+(s%300), posts_count: 410+(s%200),
      engagement_rate: +(5.6+(s%30)/10).toFixed(2),
      avg_likes: 0, avg_comments: 85+(s%100), avg_shares: 210+(s%200), avg_saves: 0,
      avg_story_views: 3200+(s%6800), snap_score: 480000+(s%320000),
      growth_7d: 95+(s%180), growth_30d: 380+(s%700),
      best_day: ['Friday','Saturday','Sunday'][s%3], best_hour: `${7+(s%3)}:00 PM`, top_format: ['Stories','Spotlight','Snaps'][s%3],
      history: generateHistory(s+6, 8900+(s%6000), 120),
    },
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  if (req.method === 'GET') {
    const { data: snapshots } = await supabase
      .from('analytics_snapshots')
      .select('*')
      .eq('user_id', user.id)
      .order('recorded_at', { ascending: false });

    const demo = buildDemoData(user.id);

    // Merge stored snapshots over demo data
    if (snapshots?.length) {
      snapshots.forEach(snap => {
        const p = snap.platform;
        if (!demo[p]) return;
        if (snap.followers)       demo[p].followers       = snap.followers;
        if (snap.following)       demo[p].following       = snap.following;
        if (snap.posts_count)     demo[p].posts_count     = snap.posts_count;
        if (snap.engagement_rate) demo[p].engagement_rate = snap.engagement_rate;
        if (snap.growth_7d)       demo[p].growth_7d       = snap.growth_7d;
        if (snap.growth_30d)      demo[p].growth_30d      = snap.growth_30d;
        if (snap.avg_views)       demo[p].avg_views       = snap.avg_views;
        if (snap.watch_time_hrs)  demo[p].watch_time_hrs  = snap.watch_time_hrs;
        if (snap.story_views)     demo[p].avg_story_views = snap.story_views;
        if (snap.snap_score)      demo[p].snap_score      = snap.snap_score;
        if (snap.page_reach)      demo[p].page_reach      = snap.page_reach;
      });
    }

    return res.status(200).json(demo);
  }

  if (req.method === 'POST') {
    const { platform, ...fields } = req.body;
    if (!platform) return res.status(400).json({ error: 'platform is required' });
    const { error } = await supabase.from('analytics_snapshots').upsert(
      { user_id: user.id, platform, ...fields, recorded_at: new Date().toISOString() },
      { onConflict: 'user_id,platform' }
    );
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
