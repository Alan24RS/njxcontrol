-- Actualizar función de generación de boletas para usar día fijo del mes (día 1)
-- Esta estrategia simplifica la gestión de subscripciones y mejora el reporting

CREATE OR REPLACE FUNCTION public.generar_boletas_mensuales()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_abono RECORD;
  v_dia_actual INTEGER;
  v_dia_facturacion INTEGER := 1; -- DÍA FIJO: 1 de cada mes
  v_boletas_generadas INTEGER := 0;
  v_errores JSONB[] := '{}';
BEGIN
  v_dia_actual := EXTRACT(DAY FROM CURRENT_DATE)::INTEGER;

  -- Solo ejecutar el día de facturación configurado
  IF v_dia_actual != v_dia_facturacion THEN
    RETURN jsonb_build_object(
      'mensaje', 'No es día de facturación',
      'dia_actual', v_dia_actual,
      'dia_facturacion', v_dia_facturacion,
      'boletas_generadas', 0
    );
  END IF;

  -- Generar boletas para todos los abonos activos
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
    -- Verificar que no exista ya una boleta para este mes
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
          monto,
          monto_pagado,
          estado
        ) VALUES (
          v_abono.playa_id,
          v_abono.plaza_id,
          v_abono.fecha_hora_inicio,
          CURRENT_DATE,
          CURRENT_DATE + INTERVAL '15 days',
          v_abono.precio_mensual,
          0,
          'PENDIENTE'::boleta_estado
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
    'fecha_ejecucion', CURRENT_DATE,
    'dia_facturacion', v_dia_facturacion,
    'boletas_generadas', v_boletas_generadas,
    'errores', v_errores
  );
END;
$$;

COMMENT ON FUNCTION public.generar_boletas_mensuales IS 
  'Genera boletas mensuales para todos los abonos activos el día 1 de cada mes. Simplifica gestión de subscripciones y mejora reporting.';

-- Agregar configuración de día de facturación a nivel de playa (opcional para futuro)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'playa' 
    AND column_name = 'dia_facturacion_abonos'
  ) THEN
    ALTER TABLE public.playa 
    ADD COLUMN dia_facturacion_abonos INTEGER DEFAULT 1
    CHECK (dia_facturacion_abonos >= 1 AND dia_facturacion_abonos <= 31);
    
    COMMENT ON COLUMN public.playa.dia_facturacion_abonos IS 
      'Día del mes en que se generan las boletas de abonos (1-31). Por defecto día 1.';
  END IF;
END $$;
