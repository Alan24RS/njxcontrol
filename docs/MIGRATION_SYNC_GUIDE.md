# Guía de Sincronización de Migraciones

Este documento explica cómo mantener sincronizadas las migraciones entre el entorno local y la base de datos remota de Supabase.

## 🎯 Problema Común

Cuando el historial de migraciones local no coincide con el remoto, se produce el error:

```
The remote database's migration history does not match local files in supabase/migrations directory.
```

## 🔧 Solución

### 1. Verificar Estado de Migraciones

```powershell
# Ver historial de migraciones
supabase migration list

# Verificar si hay desincronización (dry-run)
supabase db push --dry-run
```

### 2. Reparar Historial de Migraciones

Si Supabase CLI sugiere comandos de reparación, ejecútalos:

```powershell
# Revertir una migración que está en remoto pero no en local
supabase migration repair --status reverted <MIGRATION_TIMESTAMP>

# Marcar como aplicada una migración que está en local pero no en remoto
supabase migration repair --status applied <MIGRATION_TIMESTAMP>
```

### 3. Verificar Sincronización

```powershell
# Ejecutar script de verificación
.\scripts\sync-migrations.ps1

# O manualmente
supabase db push --dry-run
```

## 📋 Flujo de Trabajo Recomendado

### Al Crear Nueva Migración

1. **Crear migración localmente:**
   ```powershell
   supabase migration new <nombre_descriptivo>
   ```

2. **Editar el archivo SQL generado** en `supabase/migrations/`

3. **Aplicar localmente:**
   ```powershell
   supabase migration up
   ```

4. **Verificar que funciona:**
   ```powershell
   pnpm typecheck
   pnpm test
   ```

5. **Commit y push:**
   ```powershell
   git add .
   git commit -m "feat: add migration <descripción>"
   git push
   ```

6. **Aplicar en remoto:**
   ```powershell
   supabase db push
   ```

### Al Hacer Pull de Cambios

1. **Actualizar código:**
   ```powershell
   git pull
   ```

2. **Sincronizar con remoto:**
   ```powershell
   supabase link
   supabase db pull
   ```

3. **Aplicar migraciones nuevas localmente:**
   ```powershell
   supabase migration up
   ```

## ⚠️ Casos Especiales

### Migración Aplicada en Remoto pero No en Local

Si una migración fue aplicada directamente en producción:

```powershell
# 1. Descargar el estado actual del esquema
supabase db pull

# 2. Crear una migración con los cambios
supabase migration new sync_remote_changes

# 3. Marcar como aplicada (si ya está en remoto)
supabase migration repair --status applied <TIMESTAMP>
```

### Migración Local que No Debe Aplicarse

Si creaste una migración local que no quieres aplicar:

```powershell
# 1. Eliminar el archivo de migración
Remove-Item supabase/migrations/<TIMESTAMP>_*.sql

# 2. Si ya se aplicó localmente, revertirla
supabase migration down
```

### Conflicto de Historial (Error de Sincronización)

Este fue el caso que resolvimos:

```powershell
# La migración 20251203070507 estaba en remoto pero no en local
supabase migration repair --status reverted 20251203070507

# La migración 20251203120000 estaba en local pero no en remoto
supabase migration repair --status applied 20251203120000

# Verificar
supabase migration list
supabase db push --dry-run
```

## 🚀 Script de Automatización

Usa el script `sync-migrations.ps1` para verificar el estado:

```powershell
.\scripts\sync-migrations.ps1
```

Este script:
- ✅ Lista el historial de migraciones
- ✅ Verifica si hay desincronización
- ✅ Muestra comandos de reparación si es necesario
- ✅ Confirma cuando todo está sincronizado

## 📝 Registro de Migraciones Recientes

### Diciembre 3, 2025

- **20251203070507**: Revertida (estaba en remoto, no en local)
- **20251203120000**: `fix_boleta_monto_and_add_id_to_view` - Aplicada correctamente
  - Arregla bug de boleta.monto usando p_monto_pago en lugar de v_precio_mensual
  - Agrega boleta_id a v_boletas view

## 🔗 Referencias

- [Supabase CLI - Migrations](https://supabase.com/docs/guides/cli/local-development#database-migrations)
- [Migration Repair Command](https://supabase.com/docs/reference/cli/supabase-migration-repair)
- Proyecto: `ANALISIS_OPERACIONES_BD.md` para detalles de funciones de negocio
