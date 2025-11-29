# Script para cargar variables de entorno y ejecutar MCP de Supabase
# Este script carga las variables desde .mcp.env y ejecuta el servidor MCP

# Cargar variables de entorno desde .mcp.env
$mcpEnvFile = Join-Path $PSScriptRoot ".." ".mcp.env"

if (Test-Path $mcpEnvFile) {
    Get-Content $mcpEnvFile | ForEach-Object {
        if ($_ -match '^([^#][^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
}

# Ejecutar el servidor MCP de Supabase
$env:SUPABASE_PROJECT_REF = $env:SUPABASE_PROJECT_REF
$env:SUPABASE_ACCESS_TOKEN = $env:SUPABASE_ACCESS_TOKEN

npx -y "@supabase/mcp-server-supabase@latest" `
    --read-only `
    --project-ref="$env:SUPABASE_PROJECT_REF" `
    --access-token="$env:SUPABASE_ACCESS_TOKEN"
