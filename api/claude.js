/**
 * /api/claude.js — Anthropic API proxy with optional web search
 * Supports: standard messages + web_search tool for research-enabled calls
 */
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not set' });

  // Parse body
  let body = req.body;
  if (!body || Object.keys(body).length === 0) {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    try { body = JSON.parse(Buffer.concat(chunks).toString()); }
    catch(e) { return res.status(400).json({ error: 'Invalid JSON body' }); }
  }

  // Always use a valid model
  body.model = 'claude-haiku-4-5-20251001';
  if (!body.max_tokens) body.max_tokens = 4000;

  // If web_search is requested, enable the tool
  if (body.use_web_search) {
    delete body.use_web_search;
    body.tools = [{ type: 'web_search_20250305', name: 'web_search' }];
    body.max_tokens = 4000;
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'web-search-2025-03-05',
      },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
