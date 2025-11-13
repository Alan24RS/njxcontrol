#!/bin/bash

set -e

if [ ! -f .env.local ]; then
    echo "❌ Error: .env.local file not found."
    echo "   Create it from .env.example and configure your Supabase settings."
    exit 1
fi

source .env.local

if [[ "$NEXT_PUBLIC_SUPABASE_URL" =~ (127\.0\.0\.1|localhost) ]]; then
    DB_ENV="local (Docker)"
elif [[ "$NEXT_PUBLIC_SUPABASE_URL" =~ \.supabase\.co ]]; then
    DB_ENV="remote (Supabase Cloud)"
else
    echo "❌ Error: Cannot determine database environment from NEXT_PUBLIC_SUPABASE_URL"
    echo "   Current value: $NEXT_PUBLIC_SUPABASE_URL"
    exit 1
fi

echo "🔍 Checking migration status..."
echo "   Environment: $DB_ENV"
echo ""

if [[ "$NEXT_PUBLIC_SUPABASE_URL" =~ \.supabase\.co ]]; then
    PROJECT_REF=$(echo "$NEXT_PUBLIC_SUPABASE_URL" | sed -E 's|https://([^.]+)\.supabase\.co.*|\1|')
    
    if [ -z "$SUPABASE_DB_PASSWORD" ]; then
        echo "❌ Error: SUPABASE_DB_PASSWORD not set in .env.local"
        exit 1
    fi
    
    echo "📦 Linking to Supabase project..."
    supabase link --project-ref "$PROJECT_REF" --password "$SUPABASE_DB_PASSWORD" > /dev/null 2>&1
fi

echo "📋 Listing migrations..."
echo ""

MIGRATION_LIST_OUTPUT=$(supabase migration list 2>&1)
ORPHAN_MIGRATIONS=$(echo "$MIGRATION_LIST_OUTPUT" | grep "Remote" | grep -oE '[0-9]{14}' | tr '\n' ' ' || true)

echo "$MIGRATION_LIST_OUTPUT"
echo ""

if [ -n "$ORPHAN_MIGRATIONS" ]; then
    echo "⚠️  WARNING: Found migrations in database NOT present in code:"
    echo ""
    for migration in $ORPHAN_MIGRATIONS; do
        echo "   ❌ $migration (applied directly to DB, not in git)"
    done
    echo ""
    echo "These migrations will be automatically marked as 'reverted' during the next deployment."
    echo "This is intentional to enforce Git as the single source of truth."
    echo ""
    echo "If these migrations are important, you should:"
    echo "  1. Pull changes from database: supabase db diff"
    echo "  2. Create a new migration with those changes"
    echo "  3. Commit the migration file to git"
    echo ""
    exit 1
else
    echo "✅ All migrations are in sync!"
    echo "   Git and database are aligned."
    echo ""
fi

