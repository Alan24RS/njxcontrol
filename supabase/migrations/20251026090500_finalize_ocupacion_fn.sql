
-- ===================================================================================
-- MIGRACIÓN: Función/RPC finalizar_ocupacion_y_registrar_pago
-- Descripción:
--   - Encapsula la lógica transaccional para finalizar ocupaciones activas
--   - Calcula monto sugerido basado en tarifas y duración
--   - Inserta registro en public.pago y actualiza public.ocupacion
--   - Registra eventos en pago_event_log para observabilidad
--   - Expone RPC finalizar_ocupacion accesible para clientes autenticados
-- ===================================================================================

CREATE OR REPLACE FUNCTION public.finalizar_ocupacion_y_registrar_pago(
  p_ocupacion_id uuid,
  p_metodo_pago public.metodo_pago,
  p_monto_manual numeric,
  p_playero_id uuid,
  p_observaciones text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ocupacion RECORD;
  v_turno RECORD;
  v_metodo RECORD;
  v_tarifa RECORD;
  v_playa_id uuid;
  v_plaza_tipo_id bigint;
  v_now timestamptz := timezone('UTC', now());
  v_duracion_minutes numeric;
  v_monto_sugerido numeric(12,2);
  v_monto_final numeric(12,2);
  v_numero_pago integer;
  v_pago_id uuid;
  v_owner uuid;
BEGIN
  IF p_ocupacion_id IS NULL THEN
    RAISE LOG 'finalizar_ocupacion: VALIDATION_ERROR (ocupacion_id null)';
    RETURN jsonb_build_object('ok', false, 'error', 'VALIDATION_ERROR');
  END IF;

  SELECT o.ocupacion_id,
         o.playa_id,
         o.plaza_id,
         o.playero_id,
         o.hora_ingreso,
         o.hora_egreso,
         o.tipo_vehiculo,
         o.modalidad_ocupacion,
         o.numero_pago,
         p.tipo_plaza_id,
         py.playa_dueno_id
  INTO v_ocupacion
  FROM public.ocupacion o
  JOIN public.plaza p ON p.plaza_id = o.plaza_id
  JOIN public.playa py ON py.playa_id = o.playa_id
  WHERE o.ocupacion_id = p_ocupacion_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE LOG 'finalizar_ocupacion: OCUPACION_NOT_FOUND (%)', p_ocupacion_id;
    RETURN jsonb_build_object('ok', false, 'error', 'OCUPACION_NOT_FOUND');
  END IF;

  v_playa_id := v_ocupacion.playa_id;
  v_plaza_tipo_id := v_ocupacion.tipo_plaza_id;
  v_owner := v_ocupacion.playa_dueno_id;

  IF v_ocupacion.hora_egreso IS NOT NULL OR v_ocupacion.numero_pago IS NOT NULL THEN
    RAISE LOG 'finalizar_ocupacion: OCUPACION_ALREADY_FINALIZED (%)', p_ocupacion_id;
    RETURN jsonb_build_object('ok', false, 'error', 'OCUPACION_ALREADY_FINALIZED');
  END IF;

  -- Verificar permisos básicos (playero creador o dueño de la playa)
  IF v_ocupacion.playero_id <> p_playero_id THEN
    IF v_owner <> p_playero_id THEN
      RAISE LOG 'finalizar_ocupacion: PERMISSION_DENIED (%)', p_ocupacion_id;
      RETURN jsonb_build_object('ok', false, 'error', 'PERMISSION_DENIED');
    END IF;
  END IF;

  -- Validar turno activo del playero que ejecuta la acción
  SELECT *
  INTO v_turno
  FROM public.turno t
  WHERE t.playa_id = v_playa_id
    AND t.playero_id = p_playero_id
    AND t.fecha_hora_salida IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE LOG 'finalizar_ocupacion: TURN_NOT_ACTIVE (playa %, playero %)', v_playa_id, p_playero_id;
    RETURN jsonb_build_object('ok', false, 'error', 'TURN_NOT_ACTIVE');
  END IF;

  -- Validar método de pago activo para la playa
  SELECT 1
  INTO v_metodo
  FROM public.metodo_pago_playa m
  WHERE m.playa_id = v_playa_id
    AND m.metodo_pago = p_metodo_pago
    AND m.estado = 'ACTIVO';

  IF NOT FOUND THEN
    RAISE LOG 'finalizar_ocupacion: METODO_PAGO_INACTIVO (playa %, metodo %)', v_playa_id, p_metodo_pago;
    RETURN jsonb_build_object('ok', false, 'error', 'METODO_PAGO_INACTIVO');
  END IF;

  -- Obtener tarifa asociada
  SELECT vt.*
  INTO v_tarifa
  FROM public.v_tarifas vt
  WHERE vt.playa_id = v_playa_id
    AND vt.tipo_plaza_id = v_plaza_tipo_id
    AND vt.modalidad_ocupacion = v_ocupacion.modalidad_ocupacion
    AND vt.tipo_vehiculo = v_ocupacion.tipo_vehiculo::public.tipo_vehiculo
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE LOG 'finalizar_ocupacion: TARIFA_NOT_FOUND (playa %, plaza %, modalidad %, vehiculo %)',
      v_playa_id,
      v_plaza_tipo_id,
      v_ocupacion.modalidad_ocupacion,
      v_ocupacion.tipo_vehiculo;
    RETURN jsonb_build_object('ok', false, 'error', 'TARIFA_NOT_FOUND');
  END IF;

  v_duracion_minutes := GREATEST(
    EXTRACT(EPOCH FROM (v_now - v_ocupacion.hora_ingreso)) / 60,
    1
  );

  -- Calcular monto sugerido según modalidad
  IF v_ocupacion.modalidad_ocupacion = 'POR_HORA' THEN
    v_monto_sugerido := CEIL(v_duracion_minutes / 60) * v_tarifa.precio_base;
  ELSIF v_ocupacion.modalidad_ocupacion = 'DIARIA' THEN
    v_monto_sugerido := CEIL(v_duracion_minutes / 1440) * v_tarifa.precio_base;
  ELSIF v_ocupacion.modalidad_ocupacion = 'SEMANAL' THEN
    v_monto_sugerido := CEIL(v_duracion_minutes / (1440 * 7)) * v_tarifa.precio_base;
  ELSE
    v_monto_sugerido := v_tarifa.precio_base;
  END IF;

  IF p_monto_manual IS NULL OR p_monto_manual <= 0 THEN
    RAISE LOG 'finalizar_ocupacion: MISSING_OR_INVALID_AMOUNT (monto nulo)';
    RETURN jsonb_build_object('ok', false, 'error', 'MISSING_OR_INVALID_AMOUNT');
  END IF;

  IF v_monto_sugerido IS NULL THEN
    RAISE LOG 'finalizar_ocupacion: VALIDATION_ERROR (monto sugerido nulo)';
    RETURN jsonb_build_object('ok', false, 'error', 'VALIDATION_ERROR');
  END IF;

  IF p_monto_manual < v_monto_sugerido THEN
    RAISE LOG 'finalizar_ocupacion: MONTO_INSUFICIENTE (manual %, sugerido %)', p_monto_manual, v_monto_sugerido;
    RETURN jsonb_build_object(
      'ok',
      false,
      'error',
      'MONTO_INSUFICIENTE',
      'montoSugerido',
      v_monto_sugerido
    );
  END IF;

  v_monto_final := round(p_monto_manual::numeric, 2);

  -- Serializar numeración por playa
  PERFORM pg_advisory_xact_lock(hashtext('pago_' || v_playa_id::text));

  SELECT COALESCE(MAX(numero_pago), 0) + 1
  INTO v_numero_pago
  FROM public.pago
  WHERE playa_id = v_playa_id;

  BEGIN
    INSERT INTO public.pago (
      playa_id,
      numero_pago,
      ocupacion_id,
      boleta_id,
      metodo_pago,
      monto_pago,
      playero_id,
      turno_fecha_hora_ingreso,
      fecha_hora_ingreso,
      observaciones
    )
    VALUES (
      v_playa_id,
      v_numero_pago,
      p_ocupacion_id,
      NULL,
      p_metodo_pago,
      v_monto_final,
      p_playero_id,
      v_turno.fecha_hora_ingreso,
      v_now,
      p_observaciones
    )
    RETURNING pago_id
    INTO v_pago_id;
  EXCEPTION
    WHEN unique_violation THEN
      RAISE LOG 'finalizar_ocupacion: PAGO_DUPLICADO (playa %, numero %)', v_playa_id, v_numero_pago;
      RETURN jsonb_build_object('ok', false, 'error', 'PAGO_DUPLICADO');
  END;

  UPDATE public.ocupacion
  SET hora_egreso = v_now,
      numero_pago = v_numero_pago,
      estado = 'FINALIZADO'::public.ocupacion_estado,
      fecha_modificacion = v_now
  WHERE ocupacion_id = p_ocupacion_id;

  INSERT INTO public.pago_event_log (pago_id, evento, payload)
  VALUES (
    v_pago_id,
    'SUCCESS',
    jsonb_build_object(
      'ocupacionId', p_ocupacion_id,
      'playeroId', p_playero_id,
      'metodoPago', p_metodo_pago,
      'monto', v_monto_final,
      'numeroPago', v_numero_pago
    )
  );

  RETURN jsonb_build_object(
    'ok',
    true,
    'pagoId',
    v_pago_id,
    'numeroPago',
    v_numero_pago,
    'monto',
    v_monto_final,
    'horaEgreso',
    v_now,
    'montoSugerido',
    v_monto_sugerido
  );
END;
$$;

COMMENT ON FUNCTION public.finalizar_ocupacion_y_registrar_pago IS
  'Finaliza una ocupación activa, genera el pago correspondiente y registra eventos de auditoría.';

-- RPC amigable para Supabase (mismo contrato)
CREATE OR REPLACE FUNCTION public.finalizar_ocupacion(
  p_ocupacion_id uuid,
  p_metodo_pago public.metodo_pago,
  p_monto_manual numeric,
  p_playero_id uuid,
  p_observaciones text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN public.finalizar_ocupacion_y_registrar_pago(
    p_ocupacion_id,
    p_metodo_pago,
    p_monto_manual,
    p_playero_id,
    p_observaciones
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.finalizar_ocupacion_y_registrar_pago(
  uuid,
  public.metodo_pago,
  numeric,
  uuid,
  text
) TO authenticated;

GRANT EXECUTE ON FUNCTION public.finalizar_ocupacion(
  uuid,
  public.metodo_pago,
  numeric,
  uuid,
  text
) TO authenticated;

GRANT EXECUTE ON FUNCTION public.finalizar_ocupacion_y_registrar_pago(
  uuid,
  public.metodo_pago,
  numeric,
  uuid,
  text
) TO service_role;

GRANT EXECUTE ON FUNCTION public.finalizar_ocupacion(
  uuid,
  public.metodo_pago,
  numeric,
  uuid,
  text
) TO service_role;
