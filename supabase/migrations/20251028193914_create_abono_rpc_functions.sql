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

CREATE OR REPLACE FUNCTION public.registrar_pago_boleta(
  p_playa_id UUID,
  p_plaza_id UUID,
  p_fecha_hora_inicio_abono TIMESTAMPTZ,
  p_fecha_generacion_boleta DATE,
  p_monto DECIMAL(10, 2),
  p_metodo_pago metodo_pago
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_boleta RECORD;
  v_turno RECORD;
  v_numero_pago INTEGER;
  v_pago_id UUID;
  v_result JSONB;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.playero_playa pp
    WHERE pp.playero_id = auth.uid()
    AND pp.playa_id = p_playa_id
  ) THEN
    RAISE EXCEPTION 'No tiene permisos para registrar pagos en esta playa';
  END IF;

  SELECT * INTO v_boleta
  FROM public.boleta b
  WHERE b.playa_id = p_playa_id
    AND b.plaza_id = p_plaza_id
    AND b.fecha_hora_inicio_abono = p_fecha_hora_inicio_abono
    AND b.fecha_generacion_boleta = p_fecha_generacion_boleta;

  IF v_boleta IS NULL THEN
    RAISE EXCEPTION 'No se encontró la boleta especificada';
  END IF;

  IF (v_boleta.monto_pagado + p_monto) > v_boleta.monto THEN
    RAISE EXCEPTION 'El monto a pagar ($%) excede la deuda pendiente ($%)', 
      p_monto, 
      (v_boleta.monto - v_boleta.monto_pagado);
  END IF;

  SELECT * INTO v_turno
  FROM public.turno t
  WHERE t.playero_id = auth.uid()
    AND t.playa_id = p_playa_id
    AND t.fecha_hora_salida IS NULL
  ORDER BY t.fecha_hora_ingreso DESC
  LIMIT 1;

  IF v_turno IS NULL THEN
    RAISE EXCEPTION 'No tiene un turno activo. Debe iniciar turno para registrar pagos.';
  END IF;

  SELECT COALESCE(MAX(numero_pago), 0) + 1 INTO v_numero_pago
  FROM public.pago
  WHERE playa_id = p_playa_id;

  INSERT INTO public.pago (
    playa_id,
    numero_pago,
    playa_id_boleta,
    plaza_id_boleta,
    fecha_hora_inicio_abono,
    fecha_generacion_boleta,
    fecha_hora_pago,
    monto_pago,
    metodo_pago,
    playero_id,
    turno_fecha_hora_ingreso
  ) VALUES (
    p_playa_id,
    v_numero_pago,
    p_playa_id,
    p_plaza_id,
    p_fecha_hora_inicio_abono,
    p_fecha_generacion_boleta,
    NOW(),
    p_monto,
    p_metodo_pago,
    auth.uid(),
    v_turno.fecha_hora_ingreso
  )
  RETURNING pago_id INTO v_pago_id;

  SELECT jsonb_build_object(
    'pago_id', v_pago_id,
    'numero_pago', v_numero_pago,
    'monto', p_monto,
    'metodo_pago', p_metodo_pago,
    'boleta', jsonb_build_object(
      'numero_boleta', v_boleta.numero_de_boleta,
      'monto_total', v_boleta.monto,
      'monto_pagado_nuevo', v_boleta.monto_pagado + p_monto,
      'deuda_pendiente_nueva', v_boleta.monto - (v_boleta.monto_pagado + p_monto)
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.generar_boletas_mensuales()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_abono RECORD;
  v_dia_actual INTEGER;
  v_dia_abono INTEGER;
  v_ultimo_dia_mes INTEGER;
  v_boletas_generadas INTEGER := 0;
  v_errores JSONB[] := '{}';
BEGIN
  v_dia_actual := EXTRACT(DAY FROM CURRENT_DATE)::INTEGER;
  v_ultimo_dia_mes := EXTRACT(DAY FROM (DATE_TRUNC('MONTH', CURRENT_DATE) + INTERVAL '1 month - 1 day'))::INTEGER;

  FOR v_abono IN 
    SELECT 
      a.playa_id,
      a.plaza_id,
      a.fecha_hora_inicio,
      a.precio_mensual,
      a.abonado_id,
      EXTRACT(DAY FROM a.fecha_hora_inicio)::INTEGER as dia_cobro
    FROM public.abono a
    WHERE a.estado = 'ACTIVO'
      AND a.fecha_fin IS NULL
      AND a.precio_mensual IS NOT NULL
  LOOP
    v_dia_abono := v_abono.dia_cobro;
    
    IF v_dia_abono > v_ultimo_dia_mes THEN
      v_dia_abono := v_ultimo_dia_mes;
    END IF;
    
    IF v_dia_actual = v_dia_abono THEN
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
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'fecha_ejecucion', CURRENT_TIMESTAMP,
    'boletas_generadas', v_boletas_generadas,
    'errores', to_jsonb(v_errores),
    'dia_actual', v_dia_actual
  );
END;
$$;

COMMENT ON FUNCTION public.finalizar_abono IS 
  'Finaliza un abono verificando que no tenga boletas pendientes. Actualiza el estado a FINALIZADO y libera la plaza.';

COMMENT ON FUNCTION public.registrar_pago_boleta IS 
  'Registra un pago parcial o total de una boleta. Requiere turno activo. El trigger actualizará automáticamente el monto_pagado de la boleta.';

COMMENT ON FUNCTION public.generar_boletas_mensuales IS 
  'Genera boletas mensuales para todos los abonos activos que correspondan al día actual. Se ejecuta diariamente vía cron job. Solo genera una boleta por ciclo mensual.';

