#!/bin/bash

set -e

BRANCH_NAME=$(git rev-parse --abbrev-ref HEAD)
TARGET_BRANCH=${1:-"develop"}

echo "🔍 Validando branch: $BRANCH_NAME → $TARGET_BRANCH"

if [[ "$BRANCH_NAME" == "main" || "$BRANCH_NAME" == "develop" ]]; then
  echo "⚠️  Estás en la rama $BRANCH_NAME. Este script valida ramas de feature."
  exit 0
fi

if [[ ! $BRANCH_NAME =~ ^(feature|fix|hotfix|release|backport|docs|refactor|test|ci|chore)/.+ ]]; then
  echo ""
  echo "❌ Error: El nombre de la rama no sigue las convenciones."
  echo ""
  echo "Tu rama actual: $BRANCH_NAME"
  echo ""
  echo "Formato requerido: <tipo>/<descripcion>"
  echo ""
  echo "Tipos válidos:"
  echo "  - feature/    → Nueva funcionalidad"
  echo "  - fix/        → Corrección de bugs"
  echo "  - hotfix/     → Fix crítico en producción"
  echo "  - release/    → Preparación de release"
  echo "  - backport/   → Backport de cambios"
  echo "  - docs/       → Cambios de documentación"
  echo "  - refactor/   → Refactorización"
  echo "  - test/       → Adición de tests"
  echo "  - ci/         → Cambios en CI/CD"
  echo "  - chore/      → Tareas de mantenimiento"
  echo ""
  echo "Renombra tu rama:"
  echo "  git branch -m <tipo>/$BRANCH_NAME"
  echo ""
  exit 1
fi

BRANCH_TYPE=$(echo $BRANCH_NAME | cut -d'/' -f1)

if [[ "$TARGET_BRANCH" == "main" ]]; then
  if [[ ! "$BRANCH_TYPE" =~ ^(hotfix|release)$ ]]; then
    echo ""
    echo "❌ Error: Solo branches 'hotfix/*' y 'release/*' pueden ir a 'main'."
    echo ""
    echo "Tu branch: $BRANCH_NAME (tipo: $BRANCH_TYPE)"
    echo "Destino: $TARGET_BRANCH"
    echo ""
    echo "Para desarrollos normales, crea un PR a 'develop'."
    echo ""
    exit 1
  fi
elif [[ "$TARGET_BRANCH" == "develop" ]]; then
  if [[ "$BRANCH_TYPE" =~ ^(hotfix|release)$ ]]; then
    echo ""
    echo "⚠️  Advertencia: Branch tipo '$BRANCH_TYPE' normalmente va a 'main'."
    echo ""
    echo "Si esto es un backport, considera renombrar la rama:"
    echo "  git branch -m backport/$(echo $BRANCH_NAME | cut -d'/' -f2-)"
    echo ""
    echo "Si es intencional, puedes ignorar esta advertencia."
    echo ""
  fi
fi

echo "✅ Validación exitosa: $BRANCH_NAME → $TARGET_BRANCH"
echo ""
echo "Puedes proceder con:"
echo "  git push origin $BRANCH_NAME"
echo ""
