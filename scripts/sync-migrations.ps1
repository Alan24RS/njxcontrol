# Script para sincronizar migraciones locales con base de datos remota
# Uso: .\scripts\sync-migrations.ps1

Write-Host "🔄 Verificando sincronización de migraciones..." -ForegroundColor Cyan

# Verificar si hay diferencias
Write-Host "`n📋 Verificando estado actual..." -ForegroundColor Yellow
supabase migration list

Write-Host "`n🔍 Verificando cambios pendientes..." -ForegroundColor Yellow
$dryRun = supabase db push --dry-run 2>&1

if ($dryRun -match "Remote database is up to date") {
    Write-Host "✅ Base de datos remota sincronizada correctamente" -ForegroundColor Green
} elseif ($dryRun -match "migration history does not match") {
    Write-Host "⚠️  Historial de migraciones desincronizado" -ForegroundColor Red
    Write-Host "`nEjecuta los comandos sugeridos por Supabase CLI para reparar:" -ForegroundColor Yellow
    Write-Host $dryRun
} else {
    Write-Host "ℹ️  Hay cambios pendientes de aplicar" -ForegroundColor Blue
    Write-Host $dryRun
}

Write-Host "`n📝 Tip: Ejecuta 'supabase db push' para aplicar migraciones pendientes" -ForegroundColor Cyan
