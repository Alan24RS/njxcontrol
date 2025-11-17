# Script para agregar exclusiones en Windows Defender
# NOTA: Requiere privilegios de administrador

Write-Host "🛡️ Agregando exclusiones en Windows Defender..." -ForegroundColor Cyan
Write-Host "⚠️  Este script requiere ejecutarse como Administrador" -ForegroundColor Yellow
Write-Host ""

$projectPath = Get-Location
$exclusions = @(
    "$projectPath\.next",
    "$projectPath\node_modules",
    "$projectPath\.turbo"
)

if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "❌ Error: Este script necesita ejecutarse como Administrador" -ForegroundColor Red
    Write-Host ""
    Write-Host "Para ejecutarlo:" -ForegroundColor Cyan
    Write-Host "1. Abre PowerShell como Administrador" -ForegroundColor White
    Write-Host "2. Navega a: cd '$projectPath'" -ForegroundColor White
    Write-Host "3. Ejecuta: .\scripts\add-defender-exclusions.ps1" -ForegroundColor White
    exit 1
}

foreach ($path in $exclusions) {
    Write-Host "📁 Agregando exclusión: $path" -ForegroundColor Yellow
    try {
        Add-MpPreference -ExclusionPath $path -ErrorAction Stop
        Write-Host "   ✅ Exclusión agregada" -ForegroundColor Green
    } catch {
        Write-Host "   ⚠️  Error: $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "✨ Proceso completado!" -ForegroundColor Green
Write-Host ""
Write-Host "Para verificar las exclusiones:" -ForegroundColor Cyan
Write-Host "Get-MpPreference | Select-Object -ExpandProperty ExclusionPath" -ForegroundColor White
