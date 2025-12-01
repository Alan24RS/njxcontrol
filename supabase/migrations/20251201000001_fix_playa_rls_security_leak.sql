-- ============================================================================
-- CORRECCIÓN CRÍTICA: Eliminar política RLS que permite ver todas las playas
-- ============================================================================
-- 
-- PROBLEMA IDENTIFICADO:
-- La migración 20251129220251 creó la política "playa_select_public" que permite
-- a TODOS los usuarios autenticados ver TODAS las playas activas, sin filtrar
-- por dueño. Esto causa que los dueños vean playas que no les pertenecen.
--
-- SOLUCIÓN:
-- 1. Eliminar la política pública insegura
-- 2. Mantener solo las políticas correctas que filtran por playa_dueno_id
-- 3. Crear política específica para playeros (solo ven playas donde trabajan)
--
-- NOTA: La vista v_playas_disponibilidad debe usarse SOLO para el mapa público,
-- no para menús internos de la app donde se requiere filtrado por dueño.
-- ============================================================================

-- 1. Eliminar la política insegura que permite ver todas las playas
DROP POLICY IF EXISTS playa_select_public ON playa;

-- 2. Eliminar también la política de tipo_plaza si existe
DROP POLICY IF EXISTS tipo_plaza_select_public ON tipo_plaza;

-- 3. Crear política para PLAYEROS: solo ven playas donde están asignados
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'playa' AND policyname = 'playeros_ven_sus_playas_asignadas'
  ) THEN
    CREATE POLICY playeros_ven_sus_playas_asignadas ON playa
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM rol_usuario
          WHERE usuario_id = auth.uid()
          AND rol = 'PLAYERO'
        )
        AND EXISTS (
          SELECT 1 FROM playero_playa pp
          WHERE pp.playero_id = auth.uid()
          AND pp.playa_id = playa.playa_id
          AND pp.estado = 'ACTIVO'
          AND pp.fecha_baja IS NULL
        )
      );
  END IF;
END $$;

-- 4. Verificar que las políticas de DUENO sigan activas
-- (Deberían estar definidas en 20251004223300_add_dueno_playa_access_policy.sql)
-- Si no existen, crearlas:

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'playa' AND policyname = 'duenos_ven_sus_propias_playas'
  ) THEN
    CREATE POLICY duenos_ven_sus_propias_playas ON playa
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM rol_usuario
          WHERE usuario_id = auth.uid()
          AND rol = 'DUENO'
        )
        AND playa_dueno_id = auth.uid()
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'playa' AND policyname = 'duenos_gestionan_sus_propias_playas'
  ) THEN
    CREATE POLICY duenos_gestionan_sus_propias_playas ON playa
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM rol_usuario
          WHERE usuario_id = auth.uid()
          AND rol = 'DUENO'
        )
        AND playa_dueno_id = auth.uid()
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM rol_usuario
          WHERE usuario_id = auth.uid()
          AND rol = 'DUENO'
        )
        AND playa_dueno_id = auth.uid()
      );
  END IF;
END $$;

-- 5. Comentarios explicativos
COMMENT ON POLICY duenos_ven_sus_propias_playas ON playa IS 
  'Los dueños solo pueden ver sus propias playas (filtrado por playa_dueno_id)';

COMMENT ON POLICY playeros_ven_sus_playas_asignadas ON playa IS 
  'Los playeros solo pueden ver playas donde están activamente asignados';

COMMENT ON POLICY duenos_gestionan_sus_propias_playas ON playa IS 
  'Los dueños pueden gestionar (INSERT/UPDATE/DELETE) solo sus propias playas';

-- 6. IMPORTANTE: Actualizar la vista v_playas_disponibilidad
-- La vista debe usarse SOLO para consultas públicas (mapa), no para menús internos
COMMENT ON VIEW v_playas_disponibilidad IS 
  'Vista pública de disponibilidad de plazas. USO EXCLUSIVO: mapa público de playas. 
   NO usar en menús/filtros internos donde se requiere seguridad por dueño. 
   Para listados internos usar servicios que consulten directamente la tabla playa 
   respetando las políticas RLS.';

