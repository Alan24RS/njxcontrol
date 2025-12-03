-- Función para actualizar automáticamente el estado de boletas PENDIENTES a VENCIDAS
-- cuando se supera la fecha de vencimiento
-- Esta función debe ejecutarse diariamente mediante un cron job

CREATE OR REPLACE FUNCTION public.actualizar_boletas_vencidas()
RETURNS TABLE (
  boletas_actualizadas INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Actualizar boletas PENDIENTES que ya vencieron
  UPDATE public.boleta
  SET estado = 'VENCIDA'::boleta_estado
  WHERE estado = 'PENDIENTE'::boleta_estado
  AND fecha_vencimiento_boleta < CURRENT_DATE
  AND monto_pagado < monto;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  RETURN QUERY SELECT v_count;
END;
$$;

COMMENT ON FUNCTION public.actualizar_boletas_vencidas IS 
  'Actualiza el estado de boletas PENDIENTES a VENCIDAS cuando superan la fecha de vencimiento. Debe ejecutarse diariamente mediante cron job.';
