#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# FLŌW — One-command setup script
# Usage: bash setup.sh
# ─────────────────────────────────────────────────────────────────────────────

set -e

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
log()  { echo -e "${CYAN}▶ $1${NC}"; }
ok()   { echo -e "${GREEN}✓ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠ $1${NC}"; }
err()  { echo -e "${RED}✕ $1${NC}"; exit 1; }

echo ""
echo -e "${CYAN}╔═══════════════════════════════════════╗${NC}"
echo -e "${CYAN}║     FLŌW Social Organizer Setup       ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════╝${NC}"
echo ""

# 1. Check Node
log "Checking Node.js..."
node_version=$(node -v 2>/dev/null | tr -d 'v' | cut -d. -f1)
if [ -z "$node_version" ] || [ "$node_version" -lt 18 ]; then
  err "Node.js 18+ is required. Install from https://nodejs.org"
fi
ok "Node.js $(node -v)"

# 2. Install Vercel CLI
log "Checking Vercel CLI..."
if ! command -v vercel &>/dev/null; then
  log "Installing Vercel CLI..."
  npm install -g vercel || err "Failed to install Vercel CLI"
fi
ok "Vercel CLI $(vercel --version 2>/dev/null | head -1)"

# 3. Collect credentials
echo ""
echo -e "${YELLOW}You'll need two things before deploying:${NC}"
echo "  1. Anthropic API key  → https://console.anthropic.com/settings/keys"
echo "  2. Supabase project   → https://supabase.com (free tier is fine)"
echo ""

read -p "Enter your Anthropic API key (sk-ant-...): " ANTHROPIC_KEY
[ -z "$ANTHROPIC_KEY" ] && err "Anthropic API key is required"

read -p "Enter your Supabase project URL (https://xxx.supabase.co): " SUPA_URL
[ -z "$SUPA_URL" ] && err "Supabase URL is required"

read -p "Enter your Supabase anon key (eyJ...): " SUPA_ANON
[ -z "$SUPA_ANON" ] && err "Supabase anon key is required"

read -p "Enter your Supabase service role key (eyJ...): " SUPA_SERVICE
[ -z "$SUPA_SERVICE" ] && err "Supabase service role key is required"

# 4. Inject Supabase keys into index.html
log "Injecting Supabase credentials into index.html..."
sed -i "s|YOUR_SUPABASE_URL|${SUPA_URL}|g" index.html
sed -i "s|YOUR_SUPABASE_ANON_KEY|${SUPA_ANON}|g" index.html
ok "Supabase credentials injected"

# 5. Write .env.local
log "Writing .env.local..."
cat > .env.local << EOF
ANTHROPIC_API_KEY=${ANTHROPIC_KEY}
SUPABASE_URL=${SUPA_URL}
SUPABASE_ANON_KEY=${SUPA_ANON}
SUPABASE_SERVICE_ROLE_KEY=${SUPA_SERVICE}
EOF
ok ".env.local created"

# 6. Database schema
echo ""
echo -e "${YELLOW}Database setup:${NC}"
echo "  Open your Supabase dashboard → SQL Editor → New Query"
echo "  Paste and run the contents of: schema.sql"
echo ""
read -p "Press Enter once you've run schema.sql in Supabase..."

# 7. Deploy to Vercel
log "Starting Vercel deployment..."
vercel

log "Adding environment variables to Vercel..."
echo "$ANTHROPIC_KEY"    | vercel env add ANTHROPIC_API_KEY production --force 2>/dev/null || true
echo "$SUPA_URL"         | vercel env add SUPABASE_URL production --force 2>/dev/null || true
echo "$SUPA_ANON"        | vercel env add SUPABASE_ANON_KEY production --force 2>/dev/null || true
echo "$SUPA_SERVICE"     | vercel env add SUPABASE_SERVICE_ROLE_KEY production --force 2>/dev/null || true

log "Deploying to production..."
vercel --prod

echo ""
ok "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
ok " FLŌW is live! Check the URL above."
ok "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo " Next steps:"
echo "  • Sign up with your email in the app"
echo "  • Start composing posts in the Composer tab"
echo "  • The Analytics tab shows demo data until you"
echo "    connect real platform APIs (see README.md)"
echo ""
