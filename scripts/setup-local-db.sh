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
    WARN_MSG="⚠️  This will DELETE all LOCAL database data."
    IS_LOCAL=true
elif [[ "$NEXT_PUBLIC_SUPABASE_URL" =~ \.supabase\.co ]]; then
    DB_ENV="remote (Supabase Cloud)"
    WARN_MSG="🚨 This will RESET your REMOTE Supabase database!"
    IS_LOCAL=false
else
    echo "❌ Error: Cannot determine database environment from NEXT_PUBLIC_SUPABASE_URL"
    echo "   Current value: $NEXT_PUBLIC_SUPABASE_URL"
    exit 1
fi

echo ""
echo "🔧 Setting up database for development..."
echo "   Environment: $DB_ENV"
echo "   URL: $NEXT_PUBLIC_SUPABASE_URL"
echo ""
echo "This script will:"
if [ "$IS_LOCAL" = true ]; then
    echo "  1. Reset your local Supabase database"
    echo "  2. Apply ALL migrations in sequence"
    echo "  3. Configure RLS, triggers, functions automatically"
    echo "  4. Insert seed data for development"
else
    echo "  1. Link to remote project"
    echo "  2. Apply all pending migrations"
    echo "  3. Configure RLS, triggers, functions automatically"
    echo "  4. Insert seed data (note: won't delete existing data)"
fi
echo ""
echo "$WARN_MSG"

read -p "Continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Setup cancelled"
    exit 1
fi

echo ""
if [ "$IS_LOCAL" = true ]; then
    echo "🗑️  Resetting local database..."
    echo "⏳ This may take 30-60 seconds..."
    supabase db reset
else
    echo "🔄 Setting up remote database..."
    
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
echo "✅ Database setup complete!"
echo ""
echo "📊 Migration status:"
supabase migration list | tail -5
echo ""
echo "🎯 Database includes:"
echo "   ✓ All tables and indexes"
echo "   ✓ All RLS policies"
echo "   ✓ All triggers and functions"
echo "   ✓ Seed data for development"
echo ""
echo "💡 Start development with: pnpm dev"
echo "📖 Read more: README_DATABASE.md"

