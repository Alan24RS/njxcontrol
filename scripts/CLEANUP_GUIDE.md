# 🧹 Guía: Limpieza de Datos de Seed en Producción

## Problema

Las 861 ocupaciones de seed en producción tienen **FKs circulares** con la tabla `pago`:

- `pago` → `ocupacion` (FK: `pago_ocupacion_fk`)
- `ocupacion` → `pago` (FK: `ocupacion_pago_fk`)

Las constraints **NO son DEFERRABLE** en producción, por lo que no se pueden eliminar con scripts TypeScript normales.

## Solución: SQL Directo con SET CONSTRAINTS DEFERRED

### Paso 1: Abrir Supabase SQL Editor

1. Ir a [Supabase Dashboard](https://supabase.com/dashboard)
2. Seleccionar el proyecto de producción
3. Click en "SQL Editor" en el menú lateral

### Paso 2: Copiar y Ejecutar el Script

Abrir el archivo `scripts/cleanup-seed-sql.sql` y copiar todo su contenido al SQL Editor.

El script hace lo siguiente:

```sql
BEGIN;

-- Diferir todas las constraints FK hasta el COMMIT
SET CONSTRAINTS ALL DEFERRED;

-- Eliminar en orden:
-- 1. Pagos de ocupaciones seed (patentes AAA*, BBA*, BBM*)
-- 2. Pagos de boletas de abonados seed
-- 3. Ocupaciones seed
-- 4. Boletas de abonados seed
-- 5. abono_vehiculo
-- 6. Abonos
-- 7. Abonados seed
-- 8. Vehículos huérfanos

COMMIT;
```

### Paso 3: Verificar Resultados

El script incluye una query de verificación al final que mostrará:

```
ocupaciones_restantes | abonados_restantes | vehiculos_restantes
----------------------|--------------------|---------------------
                    0 |                  0 |                   0
```

## Alternativa: Script TypeScript (solo funciona si FKs son DEFERRABLE)

Si las FKs en tu entorno son DEFERRABLE, puedes usar:

```bash
pnpm db:cleanup --prod
```

## Prevención Futura

Para evitar que los datos de seed se acumulen:

1. **NUNCA uses estos patrones en datos reales**:
   - Patentes: `AAA*`, `BBA*`, `BBM*`
   - Emails: `abonado*@test.com`

2. **Ejecuta limpieza antes de cada seed**:

   ```bash
   # Limpiar
   pnpm db:cleanup --prod

   # Luego ejecutar seed
   pnpm db:seed:reportes
   ```

## Notas Técnicas

- La transacción SQL usa `SET CONSTRAINTS ALL DEFERRED` para diferir la validación de FKs hasta el COMMIT
- Esto permite eliminar registros en cualquier orden sin violar constraints circulares
- El script es idempotente (se puede ejecutar múltiples veces sin errores)
- Los datos reales de producción NO se afectan (solo registros con patrones específicos)

---

**Última actualización**: Diciembre 2025
