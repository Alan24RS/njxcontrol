-- Migration: Add RLS policy for dueños to view turnos in their playas
-- Description:
--   Permite a los dueños de playas ver todos los turnos realizados en sus playas
--   (tanto los propios como los de sus playeros)
-- Author: System
-- Date: 2025-12-02

-- Agregar política para que dueños vean turnos de sus playas
DROP POLICY IF EXISTS "Los dueños pueden ver turnos de sus playas" ON public.turno;
CREATE POLICY "Los dueños pueden ver turnos de sus playas"
  ON public.turno
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 
      FROM playa pl
      WHERE pl.playa_id = turno.playa_id
        AND pl.playa_dueno_id = auth.uid()
    )
  );

COMMENT ON POLICY "Los dueños pueden ver turnos de sus playas" ON public.turno IS 
  'Permite a los dueños de playas ver todos los turnos (propios y de playeros) realizados en sus playas para reportes y análisis';
