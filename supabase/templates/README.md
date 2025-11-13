# 📝 Migration Templates

Este directorio contiene templates para facilitar la creación de migraciones siguiendo las mejores prácticas del proyecto.

## 🎯 Uso del Template

### 1. Crear nueva migración

```bash
supabase migration new descriptive_name
```

Esto creará un archivo en `supabase/migrations/` con un timestamp único.

### 2. Copiar el template

Copia las secciones relevantes de `migration-template.sql` a tu nueva migración.

**No copies todo el template**, solo las secciones que necesites para tu cambio específico.

### 3. Personalizar

- Reemplaza `table_name`, `column_name`, etc. con los nombres reales
- Elimina las secciones que no necesites
- Mantén los comentarios descriptivos
- Asegúrate de que todo sea **idempotente**

## ⚠️ Reglas Críticas

### ✅ SIEMPRE usar patrones idempotentes:

- `CREATE TABLE IF NOT EXISTS`
- `CREATE INDEX IF NOT EXISTS`
- `DROP VIEW IF EXISTS` (cuando cambias columnas)
- Bloques `DO $$` con `EXCEPTION` para `ADD COLUMN` y `CREATE POLICY`

### ✅ SIEMPRE habilitar RLS en tablas nuevas:

```sql
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
```

### ✅ SIEMPRE crear políticas RLS apropiadas:

- Owner-based: usuarios ven solo sus datos
- Role-based: admins ven todo, usuarios filtrado
- Relationship-based: según relaciones en la DB

### ⚠️ CRÍTICO: RLS en Vistas

**LAS VISTAS NO HEREDAN AUTOMÁTICAMENTE LAS POLÍTICAS RLS DE LAS TABLAS BASE.**

Cuando crees una vista, **DEBES**:

1. Configurar `security_invoker = true`: `ALTER VIEW vista_name SET (security_invoker = true);`
2. Verificar que las tablas base tengan políticas RLS correctas
3. Probar que funcione correctamente

**IMPORTANTE:** Las vistas NO soportan `ENABLE ROW LEVEL SECURITY` ni `CREATE POLICY` directamente. Usa `security_invoker = true` en su lugar.

Ver [docs/RLS_VIEWS.md](../../docs/RLS_VIEWS.md) para más detalles.

### ⚠️ CRÍTICO: Funciones que Cambian Tipo de Retorno

**PostgreSQL NO permite cambiar el tipo de retorno de una función con `CREATE OR REPLACE FUNCTION`.**

Cuando modifiques una función existente y cambies:

- Tipo de retorno (`RETURNS uuid` → `RETURNS json`)
- Tipos de parámetros (`text` → `uuid`)
- Firma de la función (agregar/eliminar parámetros)

**DEBES eliminar la función primero:**

```sql
DO $$
BEGIN
  DROP FUNCTION IF EXISTS public.function_name(text, uuid);
END $$;

CREATE OR REPLACE FUNCTION public.function_name(param1 text, param2 uuid)
RETURNS json AS $$
-- ... nueva lógica ...
$$ LANGUAGE plpgsql;
```

**`CREATE OR REPLACE` es seguro solo cuando:**

- ✅ Solo cambias la lógica interna (misma firma)
- ✅ Es una función nueva (no existe aún)

Ver `docs/DATABASE.md` sección "Crear/Actualizar Funciones" para más detalles y ejemplos.

### ❌ NUNCA:

- Usar `CREATE TABLE` sin `IF NOT EXISTS`
- Usar `ALTER TABLE ADD COLUMN` sin manejo de errores
- Usar `CREATE INDEX` sin `IF NOT EXISTS`
- Usar `CREATE OR REPLACE FUNCTION` cuando cambias tipo de retorno o firma (sin `DROP FUNCTION` primero)
- Usar `CREATE OR REPLACE VIEW` cuando eliminas/cambias columnas
- Crear tablas sin RLS habilitado
- Hacer cambios directamente en Supabase Dashboard

## 📚 Referencias

Para más información, consulta:

- [DATABASE.md](../../docs/DATABASE.md) - Documentación completa de base de datos
- [WORKFLOW.md](../../docs/WORKFLOW.md) - Flujo de trabajo de desarrollo
- [.cursor/rules/database-migrations.mdc](../../.cursor/rules/database-migrations.mdc) - Reglas para agentes de IA

## 💡 Ejemplos Comunes

### Agregar una tabla con RLS

```sql
CREATE TABLE IF NOT EXISTS orders (
    order_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES usuario(usuario_id),
    total DECIMAL NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  CREATE POLICY "users_own_orders" ON orders
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
```

### Agregar columna a tabla existente

```sql
DO $$
BEGIN
  ALTER TABLE playa
    ADD COLUMN capacidad_maxima INTEGER DEFAULT 100;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

COMMENT ON COLUMN playa.capacidad_maxima IS 'Capacidad máxima de vehículos';
```

### Crear vista con datos relacionados y RLS

```sql
DROP VIEW IF EXISTS v_orders_with_users;

CREATE VIEW v_orders_with_users AS
SELECT
    o.order_id,
    o.total,
    o.created_at,
    o.user_id,
    u.email AS user_email,
    u.nombre AS user_name
FROM orders o
JOIN usuario u ON u.usuario_id = o.user_id;

-- ⚠️ CRÍTICO: Configurar security_invoker en la vista
-- Esto hace que la vista respete las políticas RLS de las tablas base
ALTER VIEW v_orders_with_users SET (security_invoker = true);

COMMENT ON VIEW v_orders_with_users IS 'Orders with user information. Usa security_invoker=true para respetar las políticas RLS de las tablas base.';
```

**Nota:** Asegúrate de que la tabla `orders` tenga políticas RLS correctas:

```sql
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  CREATE POLICY "users_own_orders" ON orders
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
```

## 🔍 Verificación

Antes de hacer commit:

1. **Probar localmente:**

   ```bash
   supabase db push
   ```

2. **Verificar idempotencia:**

   ```bash
   # Ejecutar dos veces para asegurar que no haya errores
   supabase db push
   ```

3. **Verificar estado:**
   ```bash
   supabase migration list
   ```

## 🚀 Deploy

Las migraciones se aplican automáticamente en CI/CD cuando se mergea a `develop` o `main`.

No es necesario aplicarlas manualmente en producción.
