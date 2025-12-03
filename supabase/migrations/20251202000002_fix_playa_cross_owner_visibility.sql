-- Migration: Fix playa RLS policies to prevent cross-owner visibility
-- Description:
--   Elimina la política pública que permite ver todas las playas a usuarios autenticados
--   Los dueños solo deben ver sus propias playas
--   Los playeros solo deben ver playas donde están asignados
-- Author: System
-- Date: 2025-12-02

-- Eliminar la política pública que permite ver todas las playas
DROP POLICY IF EXISTS "playa_select_public" ON public.playa;

COMMENT ON TABLE public.playa IS 'Tabla de playas de estacionamiento. RLS habilitado: dueños ven solo sus playas, playeros ven solo playas asignadas.';
