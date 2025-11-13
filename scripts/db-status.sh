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
    IS_LOCAL=true
elif [[ "$NEXT_PUBLIC_SUPABASE_URL" =~ \.supabase\.co ]]; then
    DB_ENV="remote (Supabase Cloud)"
    IS_LOCAL=false
else
    echo "❌ Error: Cannot determine database environment from NEXT_PUBLIC_SUPABASE_URL"
    echo "   Current value: $NEXT_PUBLIC_SUPABASE_URL"
    exit 1
fi

echo "📊 Database Migration Status"
echo "   Environment: $DB_ENV"
echo "   URL: $NEXT_PUBLIC_SUPABASE_URL"
echo ""

if [ "$IS_LOCAL" = false ]; then
    PROJECT_REF=$(echo "$NEXT_PUBLIC_SUPABASE_URL" | sed -E 's|https://([^.]+)\.supabase\.co.*|\1|')
    
    if [ -z "$SUPABASE_DB_PASSWORD" ]; then
        echo "❌ Error: SUPABASE_DB_PASSWORD not set in .env.local"
        echo "   Find it in: Supabase Dashboard → Settings → Database"
        exit 1
    fi
    
    echo "📦 Linking to Supabase project..."
    supabase link --project-ref "$PROJECT_REF" --password "$SUPABASE_DB_PASSWORD" > /dev/null 2>&1
fi

supabase migration list

