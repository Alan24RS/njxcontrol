DO $$
BEGIN
  DROP FUNCTION IF EXISTS public.finalizar_abono(UUID, UUID, TIMESTAMPTZ);
END $$;

CREATE OR REPLACE FUNCTION public.finalizar_abono(
  p_playa_id UUID,
  p_plaza_id UUID,
  p_fecha_hora_inicio TIMESTAMPTZ
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_abono RECORD;
  v_boletas_pendientes INTEGER;
  v_result JSONB;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.playero_playa pp
    WHERE pp.playero_id = auth.uid()
    AND pp.playa_id = p_playa_id
  ) THEN
    RAISE EXCEPTION 'No tiene permisos para finalizar abonos en esta playa';
  END IF;

  SELECT * INTO v_abono
  FROM public.abono a
  WHERE a.playa_id = p_playa_id
    AND a.plaza_id = p_plaza_id
    AND a.fecha_hora_inicio = p_fecha_hora_inicio;

  IF v_abono IS NULL THEN
    RAISE EXCEPTION 'No se encontró el abono especificado';
  END IF;

  IF v_abono.estado = 'FINALIZADO' THEN
    RAISE EXCEPTION 'El abono ya está finalizado';
  END IF;

  SELECT COUNT(*) INTO v_boletas_pendientes
  FROM public.boleta b
  WHERE b.playa_id = p_playa_id
    AND b.plaza_id = p_plaza_id
    AND b.fecha_hora_inicio_abono = p_fecha_hora_inicio
    AND b.monto_pagado < b.monto;

  IF v_boletas_pendientes > 0 THEN
    RAISE EXCEPTION 'No se puede finalizar el abono. Tiene % boleta(s) con saldo pendiente', v_boletas_pendientes;
  END IF;

  UPDATE public.abono
  SET fecha_fin = CURRENT_TIMESTAMP,
      estado = 'FINALIZADO'
  WHERE playa_id = p_playa_id
    AND plaza_id = p_plaza_id
    AND fecha_hora_inicio = p_fecha_hora_inicio;

  UPDATE public.plaza
  SET estado = 'ACTIVO'
  WHERE plaza_id = p_plaza_id
    AND playa_id = p_playa_id;

  SELECT jsonb_build_object(
    'abono_id', jsonb_build_object(
      'playa_id', p_playa_id,
      'plaza_id', p_plaza_id,
      'fecha_hora_inicio', p_fecha_hora_inicio
    ),
    'fecha_finalizacion', CURRENT_TIMESTAMP,
    'estado', 'FINALIZADO',
    'mensaje', 'Abono finalizado exitosamente'
  ) INTO v_result;

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.finalizar_abono IS 
  'Finaliza un abono verificando que no tenga boletas pendientes. Actualiza el estado a FINALIZADO, establece fecha_fin y actualiza el estado de la plaza a ACTIVO (disponible).';

