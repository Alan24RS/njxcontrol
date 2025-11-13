#!/bin/bash

# Script para cargar variables de entorno y ejecutar MCP de Supabase
# Este script carga las variables desde .mcp.env y ejecuta el servidor MCP

# Cargar variables de entorno
if [ -f ".mcp.env" ]; then
    export $(cat .mcp.env | grep -v '^#' | xargs)
fi

# Ejecutar el servidor MCP de Supabase
exec npx -y @supabase/mcp-server-supabase@latest \
    --read-only \
    --project-ref="$SUPABASE_PROJECT_REF" \
    --access-token="$SUPABASE_ACCESS_TOKEN"
