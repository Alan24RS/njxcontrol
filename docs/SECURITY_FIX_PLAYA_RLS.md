# 🔒 Corrección de Seguridad Crítica: Filtración de Datos de Playas

## ❌ Problema Identificado

**Severidad:** CRÍTICA  
**Fecha:** 1 de Diciembre de 2025  
**Impacto:** Dueños podían ver playas de otros dueños en menús y selectores

### Descripción del Bug

La migración `20251129220251_add_playas_disponibilidad_view.sql` introdujo una política RLS insegura:

```sql
CREATE POLICY playa_select_public ON playa
  FOR SELECT
  TO anon, authenticated
  USING (estado = 'ACTIVO' AND fecha_eliminacion IS NULL);
```

Esta política permitía a **TODOS los usuarios autenticados** ver **TODAS las playas activas**, sin filtrar por `playa_dueno_id`.

### Vectores de Ataque

1. **Menús desplegables:** Dueño A veía playas del Dueño B
2. **Selectores de filtros:** Analytics mostraban datos de playas ajenas
3. **Listados internos:** Violación de privacy entre dueños
4. **APIs internas:** Endpoints retornaban datos no autorizados

## ✅ Solución Implementada

### Migración de Corrección

**Archivo:** `supabase/migrations/20251201000001_fix_playa_rls_security_leak.sql`

#### Acciones Realizadas:

1. **Eliminación de política insegura**
   ```sql
   DROP POLICY IF EXISTS playa_select_public ON playa;
   DROP POLICY IF EXISTS tipo_plaza_select_public ON tipo_plaza;
   ```

2. **Política para DUEÑOS** (ya existía, se verifica)
   ```sql
   CREATE POLICY duenos_ven_sus_propias_playas ON playa
     FOR SELECT TO authenticated
     USING (
       EXISTS (SELECT 1 FROM rol_usuario WHERE usuario_id = auth.uid() AND rol = 'DUENO')
       AND playa_dueno_id = auth.uid()
     );
   ```

3. **Nueva política para PLAYEROS**
   ```sql
   CREATE POLICY playeros_ven_sus_playas_asignadas ON playa
     FOR SELECT TO authenticated
     USING (
       EXISTS (SELECT 1 FROM rol_usuario WHERE usuario_id = auth.uid() AND rol = 'PLAYERO')
       AND EXISTS (
         SELECT 1 FROM playero_playa pp
         WHERE pp.playero_id = auth.uid()
         AND pp.playa_id = playa.playa_id
         AND pp.estado = 'ACTIVO'
         AND pp.fecha_baja IS NULL
       )
     );
   ```

### Políticas RLS Finales (Tabla `playa`)

| Política | Rol | Operación | Filtro |
|----------|-----|-----------|--------|
| `duenos_ven_sus_propias_playas` | DUENO | SELECT | `playa_dueno_id = auth.uid()` |
| `duenos_gestionan_sus_propias_playas` | DUENO | ALL | `playa_dueno_id = auth.uid()` |
| `playeros_ven_sus_playas_asignadas` | PLAYERO | SELECT | Solo playas donde están activos |

### Flujo de Seguridad Correcto

```
Usuario autenticado
    ↓
¿Es DUENO?
    ↓ Sí
    └→ Ve solo playas donde playa_dueno_id = su user_id
    
¿Es PLAYERO?
    ↓ Sí
    └→ Ve solo playas donde tiene relación activa en playero_playa
    
¿Es ANON?
    ↓ Sí
    └→ No ve ninguna playa (RLS bloquea todo)
```

## 📊 Vista v_playas_disponibilidad

### Uso Correcto

La vista `v_playas_disponibilidad` está diseñada **EXCLUSIVAMENTE** para:
- ✅ Mapa público de playas (usuarios no autenticados)
- ✅ Landing page con disponibilidad en tiempo real
- ✅ Widget público de búsqueda de estacionamiento

### Uso INCORRECTO

❌ **NO usar** `v_playas_disponibilidad` en:
- Menús desplegables de filtros (admin)
- Selectores de playas en formularios internos
- Listados de gestión de playas
- Analytics y reportes (usar `v_playas` o `playa` directamente)

### Recomendación

Para listados internos usar:
```typescript
// ✅ CORRECTO: Respeta RLS
const { data } = await supabase
  .from('v_playas')  // o directamente 'playa'
  .select('*')
  // RLS automáticamente filtra por dueño

// ❌ INCORRECTO: Puede exponer datos
const { data } = await supabase
  .from('v_playas_disponibilidad')
  .select('*')
```

## 🧪 Pruebas de Validación

### Caso de Prueba 1: Dueño solo ve sus playas

```sql
-- Como dueno@test.com
SELECT playa_id, nombre, playa_dueno_id 
FROM v_playas;
-- Resultado: Solo playas donde playa_dueno_id = UUID del dueño
```

### Caso de Prueba 2: Playero solo ve playas asignadas

```sql
-- Como playero@test.com
SELECT p.playa_id, p.nombre 
FROM playa p
INNER JOIN playero_playa pp ON pp.playa_id = p.playa_id
WHERE pp.playero_id = auth.uid();
-- Resultado: Solo playas donde tiene relación activa
```

### Caso de Prueba 3: Usuario anónimo no ve nada

```sql
-- Sin autenticación
SELECT * FROM playa;
-- Resultado: [] (vacío)
```

## 🚀 Despliegue

### Local

```bash
# Aplicar migración
pnpm supabase migration up

# Verificar políticas
pnpm supabase db diff
```

### Producción

La migración se aplicará automáticamente en el próximo despliegue.

**IMPORTANTE:** Verificar después del despliegue:
1. Cada dueño ve solo sus playas
2. Menús desplegables no muestran playas ajenas
3. Analytics respetan el filtrado

## 📝 Lecciones Aprendidas

1. **Nunca crear políticas públicas sin filtros de owner** en tablas con multi-tenancy
2. **Documentar claramente** el uso de vistas públicas vs privadas
3. **Testear RLS** después de cada migración que toque políticas de seguridad
4. **Auditoría periódica** de políticas RLS en tablas críticas

## 🔗 Referencias

- Migración original (problema): `20251129220251_add_playas_disponibilidad_view.sql`
- Migración de corrección: `20251201000001_fix_playa_rls_security_leak.sql`
- Políticas base: `20251004223300_add_dueno_playa_access_policy.sql`
- Docs RLS Supabase: https://supabase.com/docs/guides/auth/row-level-security

---

**Estado:** ✅ RESUELTO  
**Requiere Action:** Desplegar migración + Verificar en producción
