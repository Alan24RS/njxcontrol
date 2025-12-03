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
  'Finaliza un abono verificando que no tenga boletas pendientes. Actualiza el estado a FINALIZADO y establece fecha_fin. NO modifica el estado de la plaza (la disponibilidad se calcula dinámicamente).';

DROP VIEW IF EXISTS public.v_abonos_vigentes CASCADE;

CREATE OR REPLACE VIEW public.v_abonos_vigentes AS
SELECT 
  a.playa_id,
  a.plaza_id,
  a.fecha_hora_inicio,
  a.fecha_fin,
  a.precio_mensual,
  a.estado,
  a.abonado_id,
  p.nombre AS playa_nombre,
  pl.identificador AS plaza_identificador,
  tp.nombre AS tipo_plaza_nombre,
  ab.nombre AS abonado_nombre,
  ab.apellido AS cliente_apellido,
  ab.dni AS abonado_dni,
  (
    a.fecha_hora_inicio::DATE + (
      (EXTRACT(YEAR FROM age(CURRENT_DATE, a.fecha_hora_inicio::DATE)) * 12 +
      EXTRACT(MONTH FROM age(CURRENT_DATE, a.fecha_hora_inicio::DATE)) +
      CASE 
        WHEN EXTRACT(DAY FROM CURRENT_DATE) > EXTRACT(DAY FROM a.fecha_hora_inicio::DATE) 
        THEN 1 
        ELSE 0 
      END)::INTEGER || ' months'
    )::INTERVAL
  )::DATE AS fecha_vencimiento
FROM public.abono a
INNER JOIN public.playa p ON a.playa_id = p.playa_id
INNER JOIN public.plaza pl ON a.plaza_id = pl.plaza_id
INNER JOIN public.tipo_plaza tp ON pl.tipo_plaza_id = tp.tipo_plaza_id
INNER JOIN public.abonado ab ON a.abonado_id = ab.abonado_id
WHERE a.estado = 'ACTIVO'
  AND a.fecha_fin IS NULL;

ALTER VIEW public.v_abonos_vigentes SET (security_invoker = true);

GRANT SELECT ON TABLE public.v_abonos_vigentes TO authenticated;
GRANT SELECT ON TABLE public.v_abonos_vigentes TO anon;
GRANT SELECT ON TABLE public.v_abonos_vigentes TO service_role;

COMMENT ON VIEW public.v_abonos_vigentes IS 'Vista de abonos vigentes con información de playa, plaza, abonado y fecha de vencimiento calculada del próximo ciclo mensual (mesiversario) basado en la fecha de inicio del abono.';

