-- =====================================================
-- MIGRACIÓN: LIMPIAR FUNCIONES DE DEBUG
-- =====================================================
-- Elimina las funciones de debug que ya no se necesitan

-- Eliminar función de debug de auto-asignación
DROP FUNCTION IF EXISTS public.debug_auto_asignar_dueno_como_playero(uuid[], uuid);

-- Comentario: Limpieza de funciones de debug temporales
