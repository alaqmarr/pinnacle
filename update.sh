#!/usr/bin/env bash
set -euo pipefail

# Pinnacle Distributing - Backend & App Production Update Script
# Usage: ./update.sh [branch]

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$APP_DIR"

PM2_APP_NAME="${PM2_APP_NAME:-pinnacle}"
PORT="${PORT:-3232}"
export PORT
TARGET_BRANCH="${1:-$(git rev-parse --abbrev-ref HEAD)}"
BACKUP_DIR="$APP_DIR/prisma/backups"
TIMESTAMP="$(date +"%Y%m%d_%H%M%S")"

log() {
  echo "[$(date +"%Y-%m-%d %H:%M:%S")] $*"
}

log "Starting backend update in $APP_DIR (branch: $TARGET_BRANCH, pm2: $PM2_APP_NAME, port: $PORT)"

# 1. Backup SQLite database before making any changes
if [ -f "$APP_DIR/prisma/dev.db" ]; then
  mkdir -p "$BACKUP_DIR"
  BACKUP_FILE="$BACKUP_DIR/dev.db.$TIMESTAMP.bak"
  cp "$APP_DIR/prisma/dev.db" "$BACKUP_FILE"
  log "Backed up SQLite database to $BACKUP_FILE"

  # Keep only the 5 most recent backups to avoid unbounded disk usage
  ls -1t "$BACKUP_DIR"/dev.db.*.bak 2>/dev/null | tail -n +6 | xargs -r rm -f --
else
  log "No existing prisma/dev.db found; skipping DB backup."
fi

# 2. Stash local tracked modifications if working tree is dirty (preserves untracked .env & DB)
STASHED=0
if ! git diff --quiet || ! git diff --cached --quiet; then
  log "Stashing tracked local modifications..."
  git stash push -m "auto-stash-update-$TIMESTAMP"
  STASHED=1
fi

# 3. Pull latest commits
log "Pulling latest changes from origin/$TARGET_BRANCH..."
git fetch origin "$TARGET_BRANCH"
git pull --ff-only origin "$TARGET_BRANCH"

# 4. Install dependencies cleanly
log "Installing Node.js dependencies..."
npm install --legacy-peer-deps

# 5. Generate Prisma Client and sync database schema
log "Generating Prisma client..."
npx prisma generate

log "Pushing Prisma schema to SQLite database..."
npx prisma db push

# 6. Build Next.js production bundle
log "Building Next.js application..."
npm run build

# 7. Restart or start application under PM2 on port $PORT
if command -v pm2 >/dev/null 2>&1; then
  if pm2 describe "$PM2_APP_NAME" >/dev/null 2>&1; then
    log "Restarting PM2 process '$PM2_APP_NAME' on port $PORT..."
    PORT="$PORT" pm2 restart "$PM2_APP_NAME" --update-env
  else
    log "PM2 process '$PM2_APP_NAME' not found; starting new PM2 process on port $PORT..."
    PORT="$PORT" pm2 start npm --name "$PM2_APP_NAME" -- start
  fi
  pm2 save
else
  log "WARNING: pm2 not found in PATH. Start/restart your server manually with 'PORT=$PORT npm run start'."
fi

if [ "$STASHED" -eq 1 ]; then
  log "Note: Local tracked changes were stashed before pull (check 'git stash list')."
fi

log "Update completed successfully!"
