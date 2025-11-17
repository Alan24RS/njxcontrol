# Script para optimizar el proyecto en OneDrive
# Marca carpetas pesadas para que OneDrive no las sincronice constantemente

Write-Host "🔧 Optimizando carpetas para OneDrive..." -ForegroundColor Cyan
Write-Host ""

$folders = @(".next", "node_modules", ".turbo", "out", "build")

foreach ($folder in $folders) {
    if (Test-Path $folder) {
        Write-Host "📁 Marcando '$folder' como local..." -ForegroundColor Yellow
        
        # Marca el directorio como "unpinned" en OneDrive
        try {
            attrib +U "$folder" /S /D
            Write-Host "   ✅ '$folder' optimizado" -ForegroundColor Green
        } catch {
            Write-Host "   ⚠️  No se pudo optimizar '$folder'" -ForegroundColor Red
        }
    } else {
        Write-Host "   ⏭️  '$folder' no existe (se creará cuando sea necesario)" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "✨ Optimización completada!" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Tip: Si sigues teniendo problemas, considera:" -ForegroundColor Cyan
Write-Host "   - Mover el proyecto fuera de OneDrive" -ForegroundColor White
Write-Host "   - Usar WSL2 para desarrollo" -ForegroundColor White
Write-Host "   - Agregar exclusiones en Windows Defender" -ForegroundColor White
