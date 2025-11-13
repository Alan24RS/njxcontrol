# Row Level Security (RLS) en Vistas

## ⚠️ IMPORTANTE: Las Vistas NO Heredan Políticas RLS Automáticamente

Este es un error crítico común: **las vistas en PostgreSQL/Supabase NO heredan automáticamente las políticas RLS de las tablas base**.

Aunque una tabla tenga políticas RLS correctamente configuradas, al crear una vista sobre esa tabla, la vista NO aplicará esas políticas automáticamente. **Debes agregar políticas RLS específicas a cada vista**.

## ❌ Ejemplo Incorrecto

```sql
-- Tabla con RLS
CREATE TABLE playa (
  playa_id uuid PRIMARY KEY,
  playa_dueno_id uuid NOT NULL,
  nombre text
);

ALTER TABLE playa ENABLE ROW LEVEL SECURITY;

CREATE POLICY "duenos_ven_sus_playas"
ON playa
FOR SELECT
TO authenticated
USING (playa_dueno_id = auth.uid());

-- Vista SIN RLS - ¡PROBLEMA!
CREATE VIEW v_playas AS
SELECT * FROM playa;

-- ⚠️ Esta vista mostrará TODAS las playas a todos los usuarios,
-- ignorando las políticas RLS de la tabla playa
```

## ✅ Ejemplo Correcto

```sql
-- Tabla con RLS (igual que antes)
CREATE TABLE playa (
  playa_id uuid PRIMARY KEY,
  playa_dueno_id uuid NOT NULL,
  nombre text
);

ALTER TABLE playa ENABLE ROW LEVEL SECURITY;

CREATE POLICY "duenos_ven_sus_playas"
ON playa
FOR SELECT
TO authenticated
USING (playa_dueno_id = auth.uid());

-- Vista con security_invoker - ¡CORRECTO!
CREATE VIEW v_playas AS
SELECT * FROM playa;

-- ⚠️ IMPORTANTE: Las vistas NO soportan ENABLE ROW LEVEL SECURITY
-- En su lugar, usa security_invoker = true
ALTER VIEW v_playas SET (security_invoker = true);
```

Con `security_invoker = true`, la vista ejecuta las consultas con los permisos del usuario que la invoca, respetando automáticamente las políticas RLS de las tablas base.

## ❌ Esto NO Funciona en Vistas

```sql
-- ❌ ERROR: Las vistas NO soportan esto
ALTER TABLE v_playas ENABLE ROW LEVEL SECURITY;

-- ❌ ERROR: No puedes crear políticas directamente en vistas
CREATE POLICY "policy_name" ON v_playas ...
```

## Checklist para Crear Vistas

Cuando crees una nueva vista, **SIEMPRE**:

1. ✅ Usa `ALTER VIEW nombre_vista SET (security_invoker = true);` para respetar RLS de tablas base
2. ✅ Prueba que los usuarios solo vean los datos correctos
3. ✅ Documenta el uso de `security_invoker` en comentarios
4. ✅ Verifica que las tablas base tengan políticas RLS correctas

## Cómo Funciona `security_invoker = true`

Cuando configuras `security_invoker = true` en una vista:

1. **La vista se ejecuta con los permisos del usuario** que la invoca (no con los permisos del creador)
2. **Las políticas RLS de las tablas base se aplican automáticamente**
3. **No necesitas crear políticas adicionales en la vista**

### Ejemplo Completo

```sql
-- 1. Tabla base con RLS
CREATE TABLE playa (
  playa_id uuid PRIMARY KEY,
  playa_dueno_id uuid NOT NULL,
  nombre text
);

ALTER TABLE playa ENABLE ROW LEVEL SECURITY;

-- Política: dueños ven sus playas
CREATE POLICY "duenos_ven_sus_playas"
ON playa FOR SELECT TO authenticated
USING (playa_dueno_id = auth.uid());

-- Política: playeros ven sus playas asignadas
CREATE POLICY "playeros_ven_sus_playas_asignadas"
ON playa FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM playero_playa
    WHERE playero_playa.playa_id = playa.playa_id
    AND playero_playa.playero_id = auth.uid()
    AND playero_playa.estado = 'ACTIVO'
  )
);

-- 2. Vista con security_invoker
CREATE VIEW v_playas AS
SELECT 
  p.playa_id,
  p.nombre,
  c.nombre AS ciudad_nombre
FROM playa p
JOIN ciudad c ON p.ciudad_id = c.ciudad_id;

ALTER VIEW v_playas SET (security_invoker = true);

-- ✅ ¡Listo! La vista respeta automáticamente las políticas RLS de la tabla playa
```

### ¿Qué pasa si NO usas `security_invoker = true`?

Sin `security_invoker = true`, la vista se ejecuta con los permisos del **creador** de la vista (generalmente el usuario de migración o admin), lo que significa que **ignora las políticas RLS** y devuelve todos los datos.

## Vistas Que Requieren RLS

En este proyecto, las siguientes vistas tienen (o deberían tener) políticas RLS:

- ✅ `v_playas` - Vista de playas con información de ciudad
- ✅ `v_playeros` - Vista de playeros con información consolidada
- ✅ `v_plazas` - Vista de plazas (usa `security_invoker`)
- ✅ `v_ocupaciones` - Vista de ocupaciones con información completa
- ✅ `v_tarifas` - Vista de tarifas con información de tipo de plaza
- ✅ `v_tipos_vehiculo` - Vista de tipos de vehículo por playa
- ✅ `v_modalidades_ocupacion` - Vista de modalidades de ocupación por playa
- ✅ `playeros_con_invitaciones` - Vista de playeros e invitaciones
- ✅ `playeros_con_estado_consolidado` - Vista de playeros con estado
- ✅ `playeros_agrupados` - Vista de playeros agrupados

## Vistas Públicas (Sin RLS)

Algunas vistas están intencionalmente sin RLS porque son públicas:

- `playa_publica` - Playas activas visibles para todos (incluyendo anónimos)
- `v_user_with_roles` - Información del usuario actual (solo ve sus propios datos por WHERE u.id = auth.uid())

## Testing RLS en Vistas

Para probar que RLS funciona correctamente en una vista:

```sql
-- Como usuario A (dueño de playa 1)
SELECT * FROM v_playas;
-- Debería ver solo sus playas

-- Como usuario B (dueño de playa 2)
SELECT * FROM v_playas;
-- Debería ver solo sus playas (diferentes a usuario A)

-- Como playero C (asignado a playa 1)
SELECT * FROM v_playas;
-- Debería ver playa 1 (donde está asignado)
```

## Migración: Corregir Vistas Existentes

Si descubres una vista sin `security_invoker`, crea una migración:

```sql
-- Migración: add_security_invoker_to_view.sql

ALTER VIEW vista_sin_rls SET (security_invoker = true);

COMMENT ON VIEW vista_sin_rls IS 
'Descripción actualizada. Usa security_invoker=true para respetar las políticas RLS de las tablas base.';
```

Es tan simple como eso. No necesitas crear políticas adicionales en la vista.

## Referencias

- [PostgreSQL Row Security Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Security Invoker Views](https://www.postgresql.org/docs/current/sql-createview.html#SQL-CREATEVIEW-SECURITY)

