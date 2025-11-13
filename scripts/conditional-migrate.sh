#!/bin/bash

if [ "$CI" = "true" ] || [ "$GITHUB_ACTIONS" = "true" ] || [ "$VERCEL" = "1" ]; then
  echo "🤖 CI environment detected."
  
  if [ "$VERCEL_ENV" = "preview" ]; then
    echo "📋 Preview deployment detected (PR or feature branch)."
    echo "   Skipping database migrations to prevent conflicts."
    echo "   Migrations will be applied when merged to develop/main."
    exit 0
  fi
  
  CURRENT_BRANCH="${VERCEL_GIT_COMMIT_REF:-${GITHUB_REF#refs/heads/}}"
  
  if [ "$CURRENT_BRANCH" = "develop" ] || [ "$CURRENT_BRANCH" = "main" ] || [ "$CURRENT_BRANCH" = "master" ]; then
    echo "🚀 Production/Staging deployment detected from branch: $CURRENT_BRANCH"
    echo "   Running database migrations..."
    bash scripts/migrate-production.sh
  else
    echo "⚠️  Unexpected branch for non-preview deployment: $CURRENT_BRANCH"
    echo "   Skipping migrations to be safe."
    exit 0
  fi
else
  if [ "$NODE_ENV" = "production" ]; then
    echo "🌍 NODE_ENV=production detected. Running database migrations..."
    bash scripts/migrate-production.sh
  else
    echo "🔧 Development environment detected. Skipping database migrations."
    echo "   To migrate locally, run: pnpm db:migrate:local"
  fi
fi

