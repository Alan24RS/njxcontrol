DO $$
BEGIN
  DROP FUNCTION IF EXISTS public.generar_boletas_mensuales();
END $$;

CREATE OR REPLACE FUNCTION public.generar_boletas_mensuales()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_abono RECORD;
  v_fecha_actual DATE := CURRENT_DATE;
  v_proximo_vencimiento DATE;
  v_fecha_generacion DATE;
  v_boletas_generadas INTEGER := 0;
  v_nueva_boleta_id UUID;
BEGIN
  FOR v_abono IN 
    SELECT * FROM public.abono 
    WHERE estado = 'ACTIVO' 
    AND (fecha_fin IS NULL OR fecha_fin > v_fecha_actual)
  LOOP
    v_proximo_vencimiento := (v_abono.fecha_hora_inicio::DATE + 
                             ((EXTRACT(YEAR FROM age(v_fecha_actual, v_abono.fecha_hora_inicio::DATE)) * 12 + 
                               EXTRACT(MONTH FROM age(v_fecha_actual, v_abono.fecha_hora_inicio::DATE)) + 1
                             )::INTEGER || ' months')::INTERVAL)::DATE;

    v_fecha_generacion := v_proximo_vencimiento - INTERVAL '3 days';

    IF v_fecha_actual >= v_fecha_generacion THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.boleta b
        WHERE b.playa_id = v_abono.playa_id 
        AND b.plaza_id = v_abono.plaza_id
        AND b.fecha_hora_inicio_abono = v_abono.fecha_hora_inicio
        AND b.fecha_vencimiento_boleta = v_proximo_vencimiento
      ) THEN
        INSERT INTO public.boleta (
          playa_id, plaza_id, fecha_hora_inicio_abono, fecha_generacion_boleta,
          fecha_vencimiento_boleta, monto, estado, numero_de_pago
        ) VALUES (
          v_abono.playa_id, v_abono.plaza_id, v_abono.fecha_hora_inicio,
          v_fecha_actual, v_proximo_vencimiento, v_abono.precio_mensual,
          'PENDIENTE', 1
        ) RETURNING boleta_id INTO v_nueva_boleta_id;

        v_boletas_generadas := v_boletas_generadas + 1;
      END IF;
    END IF;
  END LOOP;

  RETURN json_build_object('success', true, 'boletas_generadas', v_boletas_generadas);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

COMMENT ON FUNCTION public.generar_boletas_mensuales IS 
  'Genera boletas mensuales para todos los abonos activos. Las boletas se generan 3 días antes del vencimiento. El vencimiento es el mismo día del mes siguiente al inicio del abono.';

CREATE OR REPLACE VIEW v_boletas AS
SELECT 
  b.playa_id,
  b.plaza_id,
  b.fecha_hora_inicio_abono,
  b.fecha_generacion_boleta,
  b.numero_de_boleta,
  b.fecha_vencimiento_boleta,
  b.monto,
  b.monto_pagado,
  (b.monto - b.monto_pagado) as deuda_pendiente,
  b.estado,
  calculate_boleta_estado(b.monto, b.monto_pagado, b.fecha_vencimiento_boleta) as estado_calculado,
  ab.abonado_id,
  a.nombre || ' ' || a.apellido as abonado_nombre,
  a.telefono as abonado_telefono,
  a.dni as abonado_dni,
  pl.identificador as plaza_identificador,
  py.nombre as playa_nombre
FROM public.boleta b
JOIN public.abono ab ON 
  b.playa_id = ab.playa_id 
  AND b.plaza_id = ab.plaza_id 
  AND b.fecha_hora_inicio_abono = ab.fecha_hora_inicio
JOIN public.abonado a ON ab.abonado_id = a.abonado_id
JOIN public.plaza pl ON b.plaza_id = pl.plaza_id
JOIN public.playa py ON b.playa_id = py.playa_id;

COMMENT ON VIEW v_boletas IS 'Vista enriquecida de boletas con información de abonado (incluyendo teléfono), plaza y estado calculado';

