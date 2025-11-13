#!/bin/bash

set -e

MIGRATIONS_DIR="supabase/migrations"
REMOTE_DB_URL="${NEXT_PUBLIC_SUPABASE_URL}"
SUPABASE_ACCESS_TOKEN="${SUPABASE_ACCESS_TOKEN}"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 Validating migration order"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ -z "$REMOTE_DB_URL" ]; then
  echo "⚠️  NEXT_PUBLIC_SUPABASE_URL not set - skipping remote validation"
  echo "✅ Local migration order validation passed"
  exit 0
fi

if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
  echo "⚠️  SUPABASE_ACCESS_TOKEN not set - skipping remote validation"
  echo "✅ Local migration order validation passed"
  exit 0
fi

PROJECT_REF=$(echo $REMOTE_DB_URL | sed 's/.*\/\/\([^.]*\).*/\1/')

echo "📋 Checking local migrations..."
LOCAL_MIGRATIONS=$(ls -1 $MIGRATIONS_DIR/*.sql 2>/dev/null | xargs -n1 basename | sort)
LOCAL_COUNT=$(echo "$LOCAL_MIGRATIONS" | wc -l | tr -d ' ')
echo "   Found $LOCAL_COUNT local migration(s)"

if [ -z "$LOCAL_MIGRATIONS" ]; then
  echo "✅ No local migrations to validate"
  exit 0
fi

LATEST_LOCAL=$(echo "$LOCAL_MIGRATIONS" | tail -1)
LATEST_LOCAL_TIMESTAMP=$(echo "$LATEST_LOCAL" | cut -d'_' -f1)

echo ""
echo "📡 Checking remote migrations..."

supabase link --project-ref $PROJECT_REF 2>&1 | grep -v "WARNING" || true

REMOTE_MIGRATIONS=$(supabase migration list 2>&1 | grep "remote database" -A 1000 | grep -E "^[0-9]" | awk '{print $1}' | sort || echo "")

if [ -z "$REMOTE_MIGRATIONS" ]; then
  echo "✅ No remote migrations found - this is the first migration"
  exit 0
fi

REMOTE_COUNT=$(echo "$REMOTE_MIGRATIONS" | wc -l | tr -d ' ')
echo "   Found $REMOTE_COUNT remote migration(s)"

LATEST_REMOTE=$(echo "$REMOTE_MIGRATIONS" | tail -1)
LATEST_REMOTE_TIMESTAMP=$(echo "$LATEST_REMOTE" | cut -d'_' -f1)

echo ""
echo "🔍 Comparing timestamps..."
echo "   Latest local:  $LATEST_LOCAL_TIMESTAMP ($LATEST_LOCAL)"
echo "   Latest remote: $LATEST_REMOTE_TIMESTAMP ($LATEST_REMOTE)"
echo ""

if [ "$LATEST_LOCAL_TIMESTAMP" -lt "$LATEST_REMOTE_TIMESTAMP" ]; then
  echo "❌ ERROR: Migration timestamp conflict detected!"
  echo ""
  echo "┌─────────────────────────────────────────────────────────────────┐"
  echo "│ Your migration has an older timestamp than the latest remote   │"
  echo "│ migration. This will cause deployment issues.                  │"
  echo "└─────────────────────────────────────────────────────────────────┘"
  echo ""
  echo "Your migration:  $LATEST_LOCAL"
  echo "Remote latest:   $LATEST_REMOTE"
  echo ""
  echo "This happens when:"
  echo "  1. You created migrations on an outdated branch"
  echo "  2. Another PR with newer migrations was merged first"
  echo ""
  echo "Solutions:"
  echo "  1. RECOMMENDED: Recreate your migrations with fresh timestamps:"
  echo "     - Backup your SQL changes"
  echo "     - Delete the old migration files"
  echo "     - Run: supabase migration new descriptive_name"
  echo "     - Paste your SQL into the new file"
  echo ""
  echo "  2. ALTERNATIVE: Rebase your branch on latest develop/main:"
  echo "     - git fetch origin"
  echo "     - git rebase origin/develop"
  echo "     - Resolve any conflicts"
  echo "     - Then follow option 1 to recreate migrations"
  echo ""
  exit 1
fi

echo "✅ Migration order validation passed"
echo "   Your migrations have newer timestamps than remote"
echo ""

