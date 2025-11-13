CREATE OR REPLACE FUNCTION public.generar_boletas_mensuales()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_abono RECORD;
  v_dia_actual INTEGER;
  v_ultimo_dia_mes INTEGER;
  v_boletas_generadas INTEGER := 0;
  v_errores JSONB[] := '{}';
BEGIN
  v_dia_actual := EXTRACT(DAY FROM CURRENT_DATE)::INTEGER;
  v_ultimo_dia_mes := EXTRACT(DAY FROM (DATE_TRUNC('MONTH', CURRENT_DATE) + INTERVAL '1 month - 1 day'))::INTEGER;

  IF v_dia_actual != v_ultimo_dia_mes THEN
    RETURN jsonb_build_object(
      'success', true,
      'message', 'No es el último día del mes. Las boletas se generan solo el último día.',
      'dia_actual', v_dia_actual,
      'ultimo_dia_mes', v_ultimo_dia_mes,
      'boletas_generadas', 0,
      'errores', '[]'::jsonb
    );
  END IF;

  FOR v_abono IN 
    SELECT 
      a.playa_id,
      a.plaza_id,
      a.fecha_hora_inicio,
      a.precio_mensual,
      a.abonado_id
    FROM public.abono a
    WHERE a.estado = 'ACTIVO'
      AND a.fecha_fin IS NULL
      AND a.precio_mensual IS NOT NULL
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM public.boleta b
      WHERE b.playa_id = v_abono.playa_id
        AND b.plaza_id = v_abono.plaza_id
        AND b.fecha_hora_inicio_abono = v_abono.fecha_hora_inicio
        AND EXTRACT(YEAR FROM b.fecha_generacion_boleta) = EXTRACT(YEAR FROM CURRENT_DATE)
        AND EXTRACT(MONTH FROM b.fecha_generacion_boleta) = EXTRACT(MONTH FROM CURRENT_DATE)
    ) THEN
      BEGIN
        INSERT INTO public.boleta (
          playa_id,
          plaza_id,
          fecha_hora_inicio_abono,
          fecha_generacion_boleta,
          fecha_vencimiento_boleta,
          monto
        ) VALUES (
          v_abono.playa_id,
          v_abono.plaza_id,
          v_abono.fecha_hora_inicio,
          CURRENT_DATE,
          CURRENT_DATE + INTERVAL '15 days',
          v_abono.precio_mensual
        );
        
        v_boletas_generadas := v_boletas_generadas + 1;
      EXCEPTION
        WHEN OTHERS THEN
          v_errores := array_append(
            v_errores,
            jsonb_build_object(
              'abono', jsonb_build_object(
                'playa_id', v_abono.playa_id,
                'plaza_id', v_abono.plaza_id,
                'fecha_hora_inicio', v_abono.fecha_hora_inicio
              ),
              'error', SQLERRM
            )
          );
      END;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Generación de boletas completada',
    'dia_actual', v_dia_actual,
    'ultimo_dia_mes', v_ultimo_dia_mes,
    'boletas_generadas', v_boletas_generadas,
    'errores', to_jsonb(v_errores)
  );
END;
$$;

COMMENT ON FUNCTION public.generar_boletas_mensuales IS 
  'Genera boletas mensuales para todos los abonos activos. Se ejecuta SOLO el último día del mes. Cada boleta tiene vencimiento a 15 días corridos desde su generación.';

