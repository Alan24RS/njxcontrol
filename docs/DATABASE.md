# 🗄️ Base de Datos

## 📊 Estructura General

### Tablas Principales

```
┌─────────────────────────────────────────────────────────────┐
│                    ENTIDADES PRINCIPALES                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  👤 usuario                    🏖️ playa                    │
│  ├─ usuario_id (PK)           ├─ playa_id (PK)             │
│  ├─ email                      ├─ nombre                    │
│  ├─ nombre                     ├─ direccion                 │
│  ├─ cuil                      ├─ dueno_id (FK → usuario)   │
│  └─ rol                       ├─ estado                    │
│                               └─ coordenadas               │
│                                                             │
│  👨‍💼 playero                   🅿️ plaza                    │
│  ├─ playero_id (PK)           ├─ plaza_id (PK)             │
│  ├─ usuario_id (FK → usuario)  ├─ playa_id (FK → playa)    │
│  ├─ nombre                    ├─ numero                    │
│  └─ estado                    ├─ tipo_plaza_id (FK)        │
│                               └─ estado                    │
│                                                             │
│  💰 tarifa                    📋 tipo_plaza               │
│  ├─ tarifa_id (PK)            ├─ tipo_plaza_id (PK)        │
│  ├─ playa_id (FK → playa)     ├─ nombre                    │
│  ├─ tipo_plaza_id (FK)        ├─ descripcion               │
│  ├─ modalidad_id (FK)         └─ capacidad_maxima         │
│  ├─ precio                     │                           │
│  └─ vigencia_desde            │                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Relaciones Clave

```
usuario (1) ──── (N) playa
usuario (1) ──── (N) playero
playa (1) ──── (N) plaza
playa (1) ──── (N) tarifa
tipo_plaza (1) ──── (N) plaza
tipo_plaza (1) ──── (N) tarifa
```

## 🔐 Seguridad (Row Level Security)

### ⚠️ CRÍTICO: RLS en Vistas

**LAS VISTAS NO HEREDAN AUTOMÁTICAMENTE LAS POLÍTICAS RLS DE LAS TABLAS BASE.**

Este es un error común que puede exponer todos los datos de la base de datos. Cuando creas una vista sobre una tabla con RLS, debes:

1. ✅ Configurar `security_invoker = true`: `ALTER VIEW vista SET (security_invoker = true);`
2. ✅ Verificar que las tablas base tengan políticas RLS correctas
3. ✅ Probar que los usuarios solo vean los datos correctos

**IMPORTANTE:** Las vistas NO soportan `ENABLE ROW LEVEL SECURITY` ni `CREATE POLICY` directamente.

Para más detalles, ver: [docs/RLS_VIEWS.md](./RLS_VIEWS.md)

### Políticas de Seguridad

### Políticas Implementadas

```sql
-- Usuarios ven solo sus propios datos
CREATE POLICY "users_own_data" ON usuario
    FOR ALL TO authenticated
    USING (usuario_id = auth.uid())
    WITH CHECK (usuario_id = auth.uid());

-- Dueños ven solo sus playas
CREATE POLICY "duenos_own_playas" ON playa
    FOR ALL TO authenticated
    USING (dueno_id = auth.uid())
    WITH CHECK (dueno_id = auth.uid());

-- Playeros ven solo playas asignadas
CREATE POLICY "playeros_assigned_playas" ON playa
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM playero_playa pp
            WHERE pp.playa_id = playa.playa_id
            AND pp.playero_id = (
                SELECT playero_id FROM playero 
                WHERE usuario_id = auth.uid()
            )
        )
    );
```

### Roles del Sistema

```typescript
enum RolUsuario {
  DUENO = 'DUENO',           // Dueño de playas
  PLAYERO = 'PLAYERO',       // Empleado de playas
  ADMIN = 'ADMIN'            // Administrador del sistema
}
```

## 🚀 Comandos de Gestión

### Comandos Seguros (Producción OK)

```bash
# Información del ambiente
pnpm db:info

# Estado de migraciones
pnpm db:status

# Aplicar migraciones
pnpm db:migrate

# Seed datos maestros (características)
pnpm db:seed:base
```

### Comandos de Desarrollo

```bash
# Setup completo (primera vez)
pnpm db:setup

# Reset completo + usuarios de prueba
pnpm db:reset

# Solo crear usuarios de prueba
pnpm db:seed:dev
```

## 🌱 Sistema de Seeds

### Datos Maestros (`seeds/base/`)

**Propósito**: Datos esenciales del sistema (seguros para producción)

```typescript
// scripts/seeds/base/caracteristicas.ts
export const caracteristicas = [
  { nombre: 'Techada' },
  { nombre: 'Con cargador' },
  { nombre: 'Vigilancia 24/7' },
  { nombre: 'Cerca de entrada' },
  { nombre: 'Sombra natural' },
  { nombre: 'Cubierta' }
]
```

**Aplicar**:
```bash
pnpm db:seed:base
```

### Datos de Prueba (`seeds/dev/`)

**Propósito**: Testing y desarrollo (solo desarrollo)

```typescript
// scripts/seeds/dev/users.ts
export const testUsers = [
  {
    email: 'dueno@test.com',
    password: 'test1234',
    role: 'DUENO',
    name: 'Usuario Dueño'
  },
  {
    email: 'playero@test.com',
    password: 'test1234',
    role: 'PLAYERO',
    name: 'Usuario Playero'
  }
]
```

**Aplicar**:
```bash
pnpm db:seed:dev
```

## 🔄 Migraciones

### Crear Nueva Migración

```bash
# Siempre usar este comando
supabase migration new nombre_descriptivo

# Ejemplo
supabase migration new add_payment_table
```

### Estructura de Migración

```sql
-- supabase/migrations/20251004123456_add_payment_table.sql

-- 1. Crear tabla (IDEMPOTENTE)
CREATE TABLE IF NOT EXISTS payment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    amount DECIMAL NOT NULL,
    user_id UUID NOT NULL REFERENCES usuario(usuario_id)
);

-- 2. Habilitar RLS
ALTER TABLE payment ENABLE ROW LEVEL SECURITY;

-- 3. Crear políticas (IDEMPOTENTE)
DO $$ 
BEGIN
  CREATE POLICY "users_own_payments" ON payment
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
EXCEPTION 
  WHEN duplicate_object THEN 
    NULL;
END $$;

-- 4. Crear índices si es necesario (IDEMPOTENTE)
CREATE INDEX IF NOT EXISTS idx_payment_user ON payment(user_id);
```

### Aplicar Migración

```bash
# Desarrollo local
supabase db push

# Producción (automático durante deploy)
# Se aplica al hacer git push a main
```

### ⚠️ REGLA CRÍTICA: Migraciones Idempotentes

**Todas las migraciones DEBEN ser idempotentes** (ejecutables múltiples veces sin error).

#### ¿Por qué es crítico?

- Permite re-ejecutar migraciones durante troubleshooting
- Facilita sincronización de historiales de migración
- Previene errores en CI/CD cuando hay conflictos
- Permite convergencia de múltiples ambientes al mismo estado

#### Patrones de Idempotencia

**✅ Crear Tablas:**
```sql
CREATE TABLE IF NOT EXISTS table_name (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL
);
```

**✅ Agregar Columnas:**
```sql
DO $$ 
BEGIN
  ALTER TABLE table_name 
    ADD COLUMN new_column TEXT NOT NULL DEFAULT 'value';
EXCEPTION 
  WHEN duplicate_column THEN 
    NULL;
END $$;
```

**✅ Crear Índices:**
```sql
CREATE INDEX IF NOT EXISTS idx_name ON table_name(column_name);

-- Para índices únicos
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_name 
  ON table_name(column_name);
```

**✅ Crear/Actualizar Vistas:**
```sql
-- Si solo agregas columnas: seguro usar REPLACE
CREATE OR REPLACE VIEW view_name AS
  SELECT column1, column2, new_column3
  FROM table_name;

-- Si cambias/eliminas columnas: DEBES hacer DROP primero
DROP VIEW IF EXISTS view_name;

CREATE VIEW view_name AS
  SELECT column1, column2
  FROM table_name;
```

**✅ Crear Policies:**
```sql
DO $$ 
BEGIN
  CREATE POLICY "policy_name" ON table_name
    FOR ALL TO authenticated
    USING (user_id = auth.uid());
EXCEPTION 
  WHEN duplicate_object THEN 
    NULL;
END $$;
```

**✅ Crear ENUMs:**
```sql
DO $$ 
BEGIN
  CREATE TYPE enum_name AS ENUM ('VALUE1', 'VALUE2');
EXCEPTION 
  WHEN duplicate_object THEN 
    NULL;
END $$;
```

**✅ Crear/Actualizar Funciones:**

⚠️ **CRÍTICO**: PostgreSQL NO permite cambiar el tipo de retorno de una función con `CREATE OR REPLACE FUNCTION`.

**Si la función ya existe y cambias:**
- Tipo de retorno (ej: `RETURNS uuid` → `RETURNS json`)
- Tipos de parámetros (ej: `text` → `uuid`)
- Firma de la función (agregar/eliminar parámetros)

**DEBES eliminar la función primero:**

```sql
-- ❌ INCORRECTO: Esto fallará si cambias el tipo de retorno
CREATE OR REPLACE FUNCTION crear_invitacion_playero(email text)
RETURNS uuid AS $$
BEGIN
  RETURN gen_random_uuid();
END;
$$ LANGUAGE plpgsql;

-- ✅ CORRECTO: Eliminar primero, luego crear
DO $$
BEGIN
  DROP FUNCTION IF EXISTS public.crear_invitacion_playero(text);
END $$;

CREATE OR REPLACE FUNCTION public.crear_invitacion_playero(email text)
RETURNS json AS $$
DECLARE
  v_result json;
BEGIN
  v_result := json_build_object('success', true);
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;
```

**Cuando `CREATE OR REPLACE` es seguro:**
- ✅ Solo cambias la lógica interna (misma firma)
- ✅ Es una función nueva (no existe aún)

**Ejemplo real del proyecto:**

```sql
-- Migración inicial: función retorna uuid
CREATE OR REPLACE FUNCTION crear_invitacion_playero(
  p_email text,
  p_nombre text,
  p_playas_ids uuid[],
  p_dueno_id uuid
) RETURNS uuid AS $$
-- ... lógica ...
$$ LANGUAGE plpgsql;

-- Migración posterior: cambiar a retornar json
DO $$
BEGIN
  DROP FUNCTION IF EXISTS public.crear_invitacion_playero(text, text, uuid[], uuid);
END $$;

CREATE OR REPLACE FUNCTION public.crear_invitacion_playero(
  p_email text,
  p_nombre text,
  p_playas_ids uuid[],
  p_dueno_id uuid DEFAULT auth.uid()
) RETURNS json AS $$
-- ... nueva lógica ...
$$ LANGUAGE plpgsql;
```

#### Errores Comunes a Evitar

❌ **NO usar** `CREATE TABLE` sin `IF NOT EXISTS`
❌ **NO usar** `ALTER TABLE ADD COLUMN` sin manejo de errores
❌ **NO usar** `CREATE INDEX` sin `IF NOT EXISTS`
❌ **NO usar** `CREATE OR REPLACE VIEW` cuando cambias/eliminas columnas
❌ **NO usar** `CREATE POLICY` sin manejo de errores
❌ **NO usar** `CREATE OR REPLACE FUNCTION` cuando cambias el tipo de retorno o la firma (debes hacer `DROP FUNCTION IF EXISTS` primero)

### Flujo de Migraciones en CI/CD

El sistema automáticamente maneja las migraciones en diferentes escenarios:

#### ✅ Se ejecutan migraciones en:
- **Push directo a `develop`**: Deploy a staging (Vercel)
- **Push directo a `main/master`**: Deploy a production (Vercel)
- **Merges a estas ramas**: Cuando se aprueba y mergea un PR

#### ⏭️ Se skipean migraciones en:
- **Pull Requests**: Preview deployments (para evitar conflictos)
- **Feature branches**: Cualquier rama que no sea develop/main/master

#### 🔄 Auto-limpieza de migraciones huérfanas

**Política: Git es la única fuente de verdad**

El sistema automáticamente descarta cualquier migración que esté en la base de datos pero NO en el código:

1. ✅ Detecta migraciones aplicadas directamente en Supabase Dashboard
2. 🧹 Las marca como "revertidas" para excluirlas del historial
3. ✅ Continúa aplicando solo las migraciones que están en git

**Por qué es importante:**
- Fuerza a todo el equipo a seguir el flujo correcto (migración → git → deploy)
- Previene cambios no rastreados en la base de datos
- Mantiene la infraestructura como código (Infrastructure as Code)
- Evita que PRs viejos rompan el build cuando se mergen

**⚠️ Advertencia**: Si alguien hace cambios directamente en Supabase Dashboard sin crear la migración correspondiente en el código, esos cambios **seguirán en la DB** pero no se considerarán parte del historial oficial. Esto puede causar inconsistencias.

### Troubleshooting de Migraciones

#### Error: "Remote migration versions not found in local"

**Causa**: Alguien aplicó migraciones directamente en Supabase o hay migraciones que no están en el código.

**Solución manual** (si el auto-repair falla):
```bash
# 1. Identifica las migraciones problemáticas
supabase migration list

# 2. Repara manualmente
supabase migration repair --status reverted 20251012204955 20251012205000

# 3. Continúa con tu trabajo
supabase db push
```

#### Prevención y Mejores Prácticas

Para evitar conflictos y mantener el sistema limpio:

1. **NUNCA hagas cambios directamente** en Supabase Dashboard
   - ❌ NO uses el SQL Editor para modificar estructura
   - ❌ NO crees tablas/columnas manualmente en la UI
   - ✅ SÍ usa siempre `supabase migration new` para cualquier cambio

2. **Siempre haz `git pull`** antes de crear una nueva migración
   - Asegura que tienes las últimas migraciones del equipo
   - Evita conflictos de nombres de migración

3. **Sincroniza tu rama** con develop antes de hacer PR
   - `git pull origin develop` antes de crear el PR
   - Verifica que tus migraciones no entran en conflicto

4. **Las migraciones se aplican automáticamente** en CI/CD cuando se mergea
   - No necesitas aplicarlas manualmente en producción
   - El sistema descartará cualquier migración huérfana automáticamente

**⚠️ Importante**: El sistema ahora **fuerza** esta política. Cualquier cambio en la DB que no esté en git será ignorado en el próximo deploy. Esto es intencional para mantener git como la única fuente de verdad.

## 📊 Estado Actual

### Migraciones
- ✅ **91 migraciones** sincronizadas entre local y producción
- ✅ **47 políticas RLS** configuradas
- ✅ **Todas las tablas** con RLS habilitado
- ✅ **Triggers y funciones** completamente funcionales

### Datos de Prueba
- 🏙️ **2 ciudades**: Resistencia, Corrientes
- 👤 **2 usuarios**: dueno@test.com, playero@test.com
- 🏖️ **2 playas**: UTN-Parking, Centro Plaza Parking
- 🅿️ **16 plazas**: Distribuidas en diferentes tipos
- 💰 **11 tarifas**: Configuradas para diferentes modalidades
- 💳 **5 métodos de pago**: Efectivo, Mercado Pago, etc.

## 🔧 Configuración por Ambiente

### Desarrollo Local

```env
NEXT_PUBLIC_SUPABASE_URL="http://127.0.0.1:54321"
NEXT_PUBLIC_SUPABASE_ANON_KEY="<local-anon-key>"
SUPABASE_SERVICE_ROLE_KEY="<local-service-role-key>"
```

### Producción

```env
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="<prod-anon-key>"
SUPABASE_SERVICE_ROLE_KEY="<prod-service-role-key>"
SUPABASE_DB_PASSWORD="<db-password>"
```

## 🛠️ Troubleshooting

### Problemas Comunes

#### "supabase db reset no incluye RLS"
✅ **SOLUCIONADO**: Todas las políticas RLS están incluidas en las migraciones.

#### "Conflicto de migraciones en producción"
Si ves errores como "relation already exists":
1. Verifica que local y producción estén sincronizados
2. Nunca edites la base de datos directamente en Supabase Dashboard
3. Siempre usa migraciones

#### "Quiero ver el esquema completo"
```bash
cat supabase/schema_reference.sql
```

Este archivo:
- ✅ Se genera automáticamente desde producción
- ✅ Contiene el esquema completo con ~5900 líneas
- ✅ Incluye: tablas, índices, RLS, triggers, funciones, views, tipos
- ✅ Es de **solo lectura** - no lo edites manualmente

## 📚 Referencias

### Archivos Importantes

- `supabase/migrations/` - Todas las migraciones versionadas
- `supabase/schema_reference.sql` - Schema completo para referencia
- `scripts/seeds/` - Datos de seed organizados
- `scripts/db-*.sh` - Scripts de gestión de base de datos

### Comandos Útiles

```bash
# Ver estado de migraciones
supabase migration list

# Generar schema de referencia
supabase db dump --linked -f supabase/schema_reference.sql

# Reset completo (desarrollo)
supabase db reset

# Aplicar migraciones específicas
supabase db push --include-all
```

## 🎯 Mejores Prácticas

### Para Desarrolladores

1. **Git es la única fuente de verdad** ⭐
   - SOLO lo que está en `supabase/migrations/` se considera oficial
   - Cambios directos en la DB serán descartados automáticamente en el siguiente deploy
   
2. **Siempre usar migraciones** para cambios en la base de datos
   - `supabase migration new nombre_descriptivo` → editar SQL → commit → push
   
3. **TODAS las migraciones deben ser IDEMPOTENTES** 🔄⭐
   - Usar `IF NOT EXISTS`, `IF EXISTS`, bloques `DO $$` con manejo de excepciones
   - Ver sección "Migraciones Idempotentes" arriba para patrones específicos
   - Esto previene errores al sincronizar historiales o re-ejecutar migraciones
   
4. **Nunca editar directamente** en Supabase Dashboard
   - No usar SQL Editor para cambios de estructura
   - No crear tablas/columnas manualmente en la UI
   - Esto rompe el flujo de Infrastructure as Code
   
5. **Probar localmente** antes de hacer push
   - `supabase db push` en local primero
   - Verificar que funciona correctamente
   
6. **Usar RLS** en todas las tablas nuevas
   - `ALTER TABLE tabla ENABLE ROW LEVEL SECURITY;`
   - Crear políticas apropiadas para cada rol
   
7. **Documentar cambios** en los commits
   - Mensajes descriptivos que expliquen el propósito de la migración

### Para Agentes de IA

1. **Consultar schema_reference.sql** para entender la estructura
2. **Usar migraciones** para cualquier cambio en la DB
3. **SIEMPRE crear migraciones idempotentes** usando los patrones documentados arriba
4. **Respetar RLS** al crear consultas
5. **Validar datos** con los schemas existentes
6. **Mantener consistencia** con las convenciones establecidas

---

Esta documentación proporciona toda la información necesaria para trabajar con la base de datos del proyecto de forma segura y eficiente.
