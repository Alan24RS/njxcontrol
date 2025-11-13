#!/bin/bash

set -e

echo "📊 Database Environment Information"
echo "═══════════════════════════════════════════════════════════"
echo ""

if [ ! -f .env.local ]; then
    echo "⚠️  No .env.local file found"
    echo "   Create one from .env.example"
    exit 0
fi

source .env.local

if [[ "$NEXT_PUBLIC_SUPABASE_URL" =~ (127\.0\.0\.1|localhost) ]]; then
    DB_TYPE="🐳 Local Docker"
    IS_LOCAL=true
elif [[ "$NEXT_PUBLIC_SUPABASE_URL" =~ \.supabase\.co ]]; then
    DB_TYPE="☁️  Remote Supabase"
    IS_LOCAL=false
else
    DB_TYPE="❓ Unknown"
    IS_LOCAL=false
fi

IS_PRODUCTION=false
if [ "$NODE_ENV" = "production" ]; then
    IS_PRODUCTION=true
fi

echo "🎯 Current Environment:"
echo "   Database Type: $DB_TYPE"
echo "   Database URL:  $NEXT_PUBLIC_SUPABASE_URL"
echo "   NODE_ENV:      ${NODE_ENV:-development}"
echo ""

echo "🛡️  Safety Protections:"
if [ "$IS_PRODUCTION" = true ]; then
    echo "   ✅ Production mode ACTIVE"
    echo "   ✅ Destructive commands are BLOCKED"
else
    echo "   ⚠️  Development mode"
    echo "   ⚠️  Destructive commands are ALLOWED"
fi

if [ "$IS_LOCAL" = false ]; then
    echo "   ⚠️  Working with REMOTE database"
    if [ -z "$SUPABASE_DB_PASSWORD" ]; then
        echo "   ❌ SUPABASE_DB_PASSWORD not set"
    else
        echo "   ✅ SUPABASE_DB_PASSWORD is set"
    fi
fi
echo ""

echo "📋 Available Commands:"
echo ""
echo "  Safe (can use in production):"
echo "    pnpm db:migrate       Apply pending migrations"
echo "    pnpm db:status        Show migration status"
echo "    pnpm db:seed:base     Seed master data (plaza characteristics)"
echo ""
echo "  Development only:"
echo "    pnpm db:setup         First-time setup (migrations + seeds)"
echo "    pnpm db:seed:dev      Seed test data (cities, users, playas)"
if [ "$IS_PRODUCTION" = false ]; then
    echo "    pnpm db:reset:dev     Reset database (BLOCKED in production)"
else
    echo "    pnpm db:reset:dev     Reset database (❌ BLOCKED in production)"
fi
echo ""
echo "  Information:"
echo "    pnpm db:info          Show this information"
echo ""

if [ "$IS_LOCAL" = false ] && [ "$IS_PRODUCTION" = false ]; then
    echo "⚠️  WARNING: You are working with a REMOTE database in development mode"
    echo "   Be careful with destructive operations!"
    echo ""
fi

