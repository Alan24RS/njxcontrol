# 🛠️ Scripts de Base de Datos

## 📋 Política de Migraciones

### 🎯 Git como Única Fuente de Verdad

Este proyecto sigue el principio de **Infrastructure as Code**:

- ✅ **SOLO** las migraciones en `supabase/migrations/` son oficiales
- ✅ Los cambios **DEBEN** estar en git antes de aplicarse
- ❌ Los cambios directos en la DB **SERÁN DESCARTADOS** automáticamente

### ⚠️ Importante para el Equipo

Si alguien hace cambios directamente en Supabase Dashboard (SQL Editor, crear tablas manualmente, etc.) **sin crear la migración correspondiente en el código**:

1. Los cambios físicos permanecerán en la base de datos
2. Pero serán marcados como "no oficiales" en el historial
3. En el próximo deploy, el sistema los ignorará
4. Esto puede causar inconsistencias si otros esperan que esos cambios existan

### ✅ Flujo Correcto

```bash
# 1. Actualizar código
git pull origin develop

# 2. Crear migración
supabase migration new add_new_feature

# 3. Editar el archivo generado en supabase/migrations/
# Ejemplo: 20251020123456_add_new_feature.sql
# 💡 TIP: Usa el template en supabase/templates/migration-template.sql

# 4. ⚠️ IMPORTANTE: Asegúrate de que la migración sea IDEMPOTENTE
# Ver: supabase/templates/README.md

# 5. Probar localmente
supabase db push

# 6. Verificar idempotencia (ejecutar dos veces)
supabase db push

# 7. Commitear y pushear
git add supabase/migrations/
git commit -m "feat: ✨ add new feature migration"
git push

# 8. El CI/CD aplicará automáticamente en staging/production
```

### ❌ Flujo Incorrecto (NO HACER)

```bash
# ❌ NO: Ir a Supabase Dashboard
# ❌ NO: Usar SQL Editor
# ❌ NO: Crear tablas/columnas manualmente
# ❌ NO: Aplicar cambios directamente en la DB
# ❌ NO: Crear migraciones que NO sean idempotentes
# ❌ NO: Usar CREATE OR REPLACE FUNCTION cuando cambias tipo de retorno
```

### ⚠️ Regla Crítica: Migraciones Idempotentes

**TODAS las migraciones DEBEN ser idempotentes** (ejecutables múltiples veces sin error).

#### ✅ Usar:

- `CREATE TABLE IF NOT EXISTS`
- `CREATE INDEX IF NOT EXISTS`
- `DROP VIEW IF EXISTS` antes de `CREATE VIEW` (cuando cambias columnas)
- Bloques `DO $$` con `EXCEPTION` para `ADD COLUMN` y `CREATE POLICY`
- `DROP FUNCTION IF EXISTS` antes de `CREATE OR REPLACE FUNCTION` cuando cambias tipo de retorno o firma

#### 📝 Template Disponible

Usa el template oficial para asegurar idempotencia:

```bash
# Ver template con ejemplos
cat supabase/templates/migration-template.sql

# Leer guía completa
cat supabase/templates/README.md
```

#### 🔍 Verificar Idempotencia

Ejecuta la migración dos veces para asegurarte de que no haya errores:

```bash
supabase db push  # Primera vez
supabase db push  # Segunda vez - no debe fallar
```

#### ⚠️ Error Común: Funciones que Cambian Tipo de Retorno

**Problema**: PostgreSQL no permite cambiar el tipo de retorno de una función con `CREATE OR REPLACE FUNCTION`.

**Solución**: Siempre eliminar la función primero cuando cambies:

- Tipo de retorno (`RETURNS uuid` → `RETURNS json`)
- Tipos de parámetros (`text` → `uuid`)
- Firma de la función (agregar/eliminar parámetros)

```sql
-- ✅ CORRECTO
DO $$
BEGIN
  DROP FUNCTION IF EXISTS public.function_name(text, uuid);
END $$;

CREATE OR REPLACE FUNCTION public.function_name(param1 text, param2 uuid)
RETURNS json AS $$
-- ... nueva lógica ...
$$ LANGUAGE plpgsql;
```

Ver `docs/DATABASE.md` sección "Crear/Actualizar Funciones" para más detalles.

#### 📚 Más Información

Para patrones específicos y ejemplos, consulta:

- `docs/DATABASE.md` - Sección "Migraciones Idempotentes" y "Crear/Actualizar Funciones"
- `.cursor/rules/database-migrations.mdc` - Reglas completas
- `supabase/templates/` - Templates y ejemplos

## 📜 Scripts Disponibles

### Scripts de Gestión

#### `conditional-migrate.sh`

**Cuándo se ejecuta**: Automáticamente en CI/CD antes del build

**Qué hace**:

- Detecta el tipo de deployment (preview vs production)
- ⏭️ **Skipea** migraciones en PRs y feature branches
- ✅ **Ejecuta** migraciones solo en develop/main/master

**Variables que lee**:

- `VERCEL_ENV`: Determina si es preview o production
- `VERCEL_GIT_COMMIT_REF`: Branch actual
- `GITHUB_REF`: Branch en GitHub Actions

#### `migrate-production.sh`

**Cuándo se ejecuta**: Llamado por `conditional-migrate.sh` cuando corresponde

**Qué hace**:

1. 🔍 Conecta a la base de datos (local o remota)
2. 🧹 **Detecta migraciones huérfanas** (en DB pero no en código)
3. ❌ **Marca como "revertidas"** las migraciones huérfanas
4. ✅ Aplica solo las migraciones que están en git
5. 📊 Reporta el resultado

**Output ejemplo**:

```
🔍 Enforcing Git as single source of truth for migrations...
   Policy: Any migration not in code (git) will be discarded.

🧹 Found migrations in database NOT present in code:
   ❌ 20251012204955 (applied directly to DB, not in git)
   ❌ 20251013000000 (applied directly to DB, not in git)

   These migrations will be marked as 'reverted' to maintain consistency.
   Reason: All changes must be tracked in git via migration files.

✅ Migration history cleaned. Git is now the source of truth.
```

#### `db-info.sh`

Muestra información del ambiente actual (URL, status, etc.)

#### `db-status.sh`

Muestra el estado de las migraciones

#### `reset-local-db.sh`

⚠️ **SOLO DESARROLLO**: Resetea completamente la base de datos local

#### `setup-local-db.sh`

Configura la base de datos local por primera vez

#### `validate-migration-order.sh`

**Cuándo se ejecuta**: Automáticamente en CI/CD antes de aplicar migraciones

**Qué hace**:

- 🔍 Compara timestamps de migraciones locales vs remotas
- ⚠️ Detecta conflictos de orden (migraciones con timestamps antiguos)
- 📋 Proporciona instrucciones claras para resolver conflictos
- ✅ Previene errores de deployment por migraciones fuera de orden

**Por qué es importante**:

Cuando trabajas en una rama por varios días y otro PR se mergea primero con migraciones más recientes, tus migraciones quedarán con timestamps antiguos. Esto causa el error:

```
Found local migration files to be inserted before the last migration on remote database.
```

**Cómo resolver**:

El script te guiará, pero básicamente:

1. Guarda tu SQL en un archivo temporal
2. Borra las migraciones antiguas
3. Crea nuevas con `supabase migration new nombre`
4. Pega tu SQL en los nuevos archivos

### Scripts de Seed

#### `db-seed.ts`

**Script unificado** que ejecuta todos los seeds:

- Datos maestros (características, etc.)
- Datos de prueba (usuarios, playas, tarifas, etc.)

**Datos modulares** en `seeds/`:

- `seeds/base/` - Datos maestros
- `seeds/dev/` - Datos de prueba

**Uso**: `pnpm db:seed` - Ejecuta todo

## 🔧 Comandos NPM

```bash
# Ver información del ambiente
pnpm db:info

# Ver estado de migraciones
pnpm db:status

# ⭐ Verificar si hay migraciones huérfanas
pnpm db:check

# Aplicar migraciones localmente
pnpm db:migrate

# Setup completo (primera vez)
pnpm db:setup

# Reset completo + seed (solo desarrollo)
pnpm db:reset

# Seed completo (base + dev data)
pnpm db:seed
```

### 💡 Comando Recomendado Antes de Deploy

**Siempre ejecuta antes de hacer PR o merge:**

```bash
pnpm db:check
```

Este comando te alertará si hay migraciones en la base de datos que no están en tu código, permitiéndote corregir el problema antes del deploy.

## 🚨 Troubleshooting

### "Remote migration versions not found in local"

**Causa**: Alguien aplicó migraciones directamente en Supabase

**Solución**: El sistema lo maneja automáticamente, pero puedes hacerlo manual:

```bash
# Ver qué migraciones están huérfanas
supabase migration list

# Repararlas manualmente
supabase migration repair --status reverted 20251012204955
```

### "Cannot determine database environment"

**Causa**: Variable `NEXT_PUBLIC_SUPABASE_URL` no está configurada

**Solución**:

```bash
# Verificar .env.local
cat .env.local | grep SUPABASE_URL

# O configurar en Vercel/GitHub
# Settings → Environment Variables
```

## 🎓 Para Nuevos Desarrolladores

1. **Lee la documentación**: `docs/DATABASE.md`
2. **Nunca uses Supabase Dashboard** para cambios de estructura
3. **Siempre crea migraciones** con `supabase migration new`
4. **Prueba localmente** con `supabase db push`
5. **Commitea las migraciones** junto con tu código
6. **El CI/CD se encarga del resto**

## 🤖 Para Agentes de IA

- Consulta `supabase/schema_reference.sql` para ver el schema completo
- Siempre genera migraciones con `supabase migration new`
- **CRÍTICO**: Usa el template de `supabase/templates/migration-template.sql`
- **SIEMPRE crea migraciones idempotentes** siguiendo los patrones documentados
- Respeta las políticas RLS existentes
- No asumas cambios directos en la DB
- Todo debe pasar por git

---

**Última actualización**: Octubre 2025
**Mantenedor**: Equipo Valet
