#!/bin/bash

if [ "$CI" = "true" ] || [ "$GITHUB_ACTIONS" = "true" ] || [ "$VERCEL" = "1" ]; then
  echo "🤖 CI environment detected."
  echo "   Database migrations are handled by GitHub Actions workflow."
  echo "   Skipping migrations during Vercel build."
  exit 0
else
  if [ "$NODE_ENV" = "production" ]; then
    echo "🌍 NODE_ENV=production detected. Running database migrations..."
    bash scripts/migrate-production.sh
  else
    echo "🔧 Development environment detected. Skipping database migrations."
    echo "   To migrate locally, run: pnpm db:migrate:local"
  fi
fi

