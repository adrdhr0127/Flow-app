# FLŌW — Social Media Organizer
> AI-powered social media command center with analytics, scheduling, proofreading, and content generation.

---

## What's Included

| File | Purpose |
|---|---|
| `index.html` | Full single-page app (auth, composer, queue, calendar, ideas, proofread, analytics) |
| `api/claude.js` | Serverless proxy that keeps your Anthropic API key safe on the server |
| `vercel.json` | Vercel routing config |
| `package.json` | Project metadata |
| `.env.example` | Environment variable template |

---

## Deploy in 5 Minutes

### Step 1 — Get Your API Keys

**Anthropic (required for AI features)**
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create an API key under "API Keys"
3. Copy it — you'll add it to Vercel in Step 3

**Supabase (required for user accounts)**
1. Go to [supabase.com](https://supabase.com) and create a free project
2. Go to **Project Settings → API**
3. Copy your **Project URL** and **anon (public) key**
4. Open `index.html` and replace these two lines near the top of the `<script>` tag:
   ```js
   const SUPABASE_URL = 'YOUR_SUPABASE_URL';       // ← paste your project URL
   const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // ← paste your anon key
   ```
   The anon key is safe to put in frontend code — it's designed to be public.

### Step 2 — Install Vercel CLI

```bash
npm install -g vercel
```

### Step 3 — Deploy

```bash
# Clone / download this project, then:
cd flow-app

# Deploy (follow the prompts — select your team, name the project)
vercel

# Add your Anthropic API key as a secret environment variable
vercel env add ANTHROPIC_API_KEY
# Paste your sk-ant-... key when prompted, select all environments

# Redeploy to apply the env var
vercel --prod
```

That's it. Vercel gives you a URL like `https://flow-app.vercel.app`.

---

## Local Development

```bash
# Install Vercel dev server
npm install -g vercel

# Create a .env.local file (never commit this)
cp .env.example .env.local
# Edit .env.local and add your ANTHROPIC_API_KEY

# Run locally — the /api/claude route works automatically
vercel dev

# Open http://localhost:3000
```

---

## Connecting Real Social Media Analytics

The analytics tab currently shows realistic demo data. To connect real accounts:

### Instagram (Meta Graph API)
1. Create a [Meta Developer App](https://developers.facebook.com)
2. Add the **Instagram Graph API** product
3. Get a long-lived User Access Token
4. Add to Vercel: `vercel env add INSTAGRAM_ACCESS_TOKEN`
5. Create `/api/instagram.js` to proxy calls to:
   ```
   GET https://graph.instagram.com/me/media?fields=id,caption,like_count,comments_count,timestamp&access_token={token}
   GET https://graph.instagram.com/me?fields=followers_count,follows_count,media_count&access_token={token}
   ```

### Twitter / X (Twitter API v2)
1. Apply for access at [developer.twitter.com](https://developer.twitter.com)
2. Create a project + app, get your Bearer Token
3. Add to Vercel: `vercel env add TWITTER_BEARER_TOKEN`
4. Proxy calls to:
   ```
   GET https://api.twitter.com/2/users/:id?user.fields=public_metrics
   GET https://api.twitter.com/2/users/:id/tweets?tweet.fields=public_metrics
   ```

### TikTok (TikTok for Developers)
1. Register at [developers.tiktok.com](https://developers.tiktok.com)
2. Apply for the **Research API** or **Content Posting API**
3. Note: TikTok's API access requires app review (2-4 weeks)

### LinkedIn (LinkedIn API)
1. Create an app at [linkedin.com/developers](https://linkedin.com/developers)
2. Request the **r_organization_social** and **r_analytics** permissions
3. Use OAuth 2.0 flow to get an access token

### YouTube (YouTube Data API v3)
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project and enable the **YouTube Data API v3**
3. Create an **OAuth 2.0 Client ID** (Web application type)
4. Add your Vercel domain to the Authorized Redirect URIs
5. Add to Vercel: `vercel env add YOUTUBE_CLIENT_ID` and `vercel env add YOUTUBE_CLIENT_SECRET`
6. Create `/api/youtube.js` to proxy calls to:
   ```
   # Channel stats (subscribers, views, videos)
   GET https://www.googleapis.com/youtube/v3/channels?part=statistics&mine=true
   
   # Video list with performance data
   GET https://www.googleapis.com/youtube/v3/search?part=snippet&forMine=true&type=video&order=viewCount
   
   # Video analytics (watch time, impressions, CTR) — requires YouTube Analytics API
   GET https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==MINE&metrics=views,estimatedMinutesWatched,averageViewDuration,likes,comments&dimensions=day&startDate=30daysAgo&endDate=today
   ```
7. Note: YouTube Analytics API is separate from YouTube Data API — enable both in Google Cloud Console
8. Use `googleapis` npm package for easier OAuth token refresh handling:
   ```bash
   npm install googleapis
   ```

---

## Adding a Real Database for Analytics History

For storing follower history over time (so data persists between sessions):

1. In your Supabase project, go to **SQL Editor** and run:
   ```sql
   create table analytics_snapshots (
     id uuid default gen_random_uuid() primary key,
     user_id uuid references auth.users(id),
     platform text not null,
     followers int,
     engagement_rate float,
     snapshot_date date default current_date,
     created_at timestamptz default now()
   );
   
   -- Row-level security: users only see their own data
   alter table analytics_snapshots enable row level security;
   create policy "Users see own data" on analytics_snapshots
     for all using (auth.uid() = user_id);
   ```

2. Create a `/api/analytics.js` serverless function to write daily snapshots.

3. Set up a Vercel Cron Job (`vercel.json`) to call it daily:
   ```json
   {
     "crons": [{
       "path": "/api/analytics/snapshot",
       "schedule": "0 6 * * *"
     }]
   }
   ```

---

## Environment Variables Reference

| Variable | Where to set | Required |
|---|---|---|
| `ANTHROPIC_API_KEY` | Vercel dashboard or `vercel env add` | Yes |
| `ALLOWED_ORIGIN` | Vercel dashboard | No (defaults to `*`) |
| `INSTAGRAM_ACCESS_TOKEN` | Vercel dashboard | Only for real IG data |
| `TWITTER_BEARER_TOKEN` | Vercel dashboard | Only for real Twitter data |
| `YOUTUBE_CLIENT_ID` | Vercel dashboard | Only for real YouTube data |
| `YOUTUBE_CLIENT_SECRET` | Vercel dashboard | Only for real YouTube data |

Supabase keys go directly in `index.html` (the anon key is safe to expose).

---

## Tech Stack

- **Frontend**: Vanilla HTML/CSS/JS (zero build step, zero dependencies)
- **Auth**: Supabase Auth (email/password, free tier handles up to 50k MAU)
- **AI**: Anthropic Claude (claude-sonnet-4) via serverless proxy
- **Hosting**: Vercel (free tier, auto-deploys from Git)
- **Database**: Supabase PostgreSQL (optional, for persisting analytics history)

---

## Customization

**Change the brand name**: Search for `FLŌW` in `index.html` and replace with your brand.

**Add more platforms**: Extend the `analyticsConfig` object in the `<script>` section with your platform's color, base stats, and daily growth rate.

**Adjust AI behavior**: Edit the system prompts in the `callClaude()` calls throughout the script section.

**Add team accounts**: Enable Supabase's Row Level Security and add a `teams` table to let multiple users share a workspace.
