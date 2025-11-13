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
    WARN_MSG="⚠️  WARNING: This will RESET your LOCAL database."
    IS_LOCAL=true
elif [[ "$NEXT_PUBLIC_SUPABASE_URL" =~ \.supabase\.co ]]; then
    DB_ENV="remote (Supabase Cloud)"
    WARN_MSG="🚨 WARNING: This will RESET your REMOTE Supabase database!"
    IS_LOCAL=false
else
    echo "❌ Error: Cannot determine database environment from NEXT_PUBLIC_SUPABASE_URL"
    echo "   Current value: $NEXT_PUBLIC_SUPABASE_URL"
    exit 1
fi

echo ""
echo "$WARN_MSG"
echo "   Environment: $DB_ENV"
echo "   URL: $NEXT_PUBLIC_SUPABASE_URL"
echo ""
echo "   This action will:"
if [ "$IS_LOCAL" = true ]; then
    echo "   - Drop all tables and data"
    echo "   - Re-run all migrations from scratch"
    echo "   - Apply seed data"
    echo "   - Create test users"
else
    echo "   - Delete all users from auth.users"
    echo "   - Delete ALL data from public tables"
    echo "   - Link to remote project"
    echo "   - Apply all pending migrations"
    echo "   - Seed database with fresh test data"
    echo ""
    echo "   ⚠️  Note: Remote reset will DELETE all auth users."
    echo "   ⚠️  It will then apply migrations and create test users."
fi
echo ""
read -p "Are you sure you want to continue? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Database reset cancelled."
    exit 0
fi

echo ""
if [ "$IS_LOCAL" = true ]; then
    echo "🔄 Resetting local database..."
    supabase db reset
else
    echo "🔄 Deleting all auth users..."
    node --env-file=.env.local --import tsx scripts/delete-auth-users.ts
    
    echo "🧹 Cleaning up ALL data from public tables..."
    node --env-file=.env.local --import tsx scripts/cleanup-all-data.ts
    
    echo "🔄 Applying migrations to remote database..."
    
    PROJECT_REF=$(echo "$NEXT_PUBLIC_SUPABASE_URL" | sed -E 's|https://([^.]+)\.supabase\.co.*|\1|')
    echo "📌 Project ref: $PROJECT_REF"
    
    if [ -z "$SUPABASE_DB_PASSWORD" ]; then
        echo "❌ Error: SUPABASE_DB_PASSWORD not set in .env.local"
        echo "   Find it in: Supabase Dashboard → Settings → Database"
        exit 1
    fi
    
    echo "📦 Linking to Supabase project..."
    supabase link --project-ref "$PROJECT_REF" --password "$SUPABASE_DB_PASSWORD"
    
    echo "🔄 Pushing migrations..."
    supabase db push --linked
fi

echo ""
echo "🌱 Seeding database..."
node --env-file=.env.local --import tsx scripts/db-seed.ts

echo ""
echo "✅ Database reset complete!"
echo ""
echo "📝 Test users available:"
echo "  - dueno@test.com / test1234 (DUENO)"
echo "  - playero@test.com / test1234 (PLAYERO)"
echo "  - playerodos@test.com / test1234 (PLAYERO)"
echo "  - duenodos@test.com / test1234 (DUENO)"
echo "  - playerotres@test.com / test1234 (PLAYERO)"
echo "  - playerocuatro@test.com / test1234 (PLAYERO)"
