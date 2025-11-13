DROP FUNCTION IF EXISTS public.create_abonado_with_abono(VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, UUID, UUID, TIMESTAMPTZ, JSONB);

CREATE OR REPLACE FUNCTION public.create_abonado_with_abono(
  p_nombre VARCHAR,
  p_apellido VARCHAR,
  p_email VARCHAR,
  p_telefono VARCHAR,
  p_dni VARCHAR,
  p_playa_id UUID,
  p_plaza_id UUID,
  p_fecha_hora_inicio TIMESTAMPTZ,
  p_vehiculos JSONB,
  p_turno_playa_id UUID,
  p_turno_playero_id UUID,
  p_turno_fecha_hora_ingreso TIMESTAMPTZ,
  p_metodo_pago metodo_pago,
  p_monto_pago DECIMAL(10, 2)
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_abonado_id INTEGER;
  v_result JSONB;
  v_abonado_existe BOOLEAN := FALSE;
  v_tipo_plaza_id BIGINT;
  v_precio_mensual DECIMAL(10, 2);
  v_vehiculo JSONB;
  v_patente VARCHAR(7);
  v_tipo_vehiculo tipo_vehiculo;
  v_vehiculos_insertados JSONB[] := '{}';
  v_pago_id UUID;
  v_numero_pago INTEGER;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.playero_playa pp
    WHERE pp.playero_id = auth.uid()
    AND pp.playa_id = p_playa_id
  ) THEN
    RAISE EXCEPTION 'No tiene permisos para crear abonados en esta playa';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.turno t
    WHERE t.playa_id = p_turno_playa_id
    AND t.playero_id = p_turno_playero_id
    AND t.fecha_hora_ingreso = p_turno_fecha_hora_ingreso
    AND t.fecha_hora_salida IS NULL
  ) THEN
    RAISE EXCEPTION 'El turno especificado no existe o ya está cerrado';
  END IF;

  SELECT tipo_plaza_id INTO v_tipo_plaza_id
  FROM public.plaza p
  WHERE p.plaza_id = p_plaza_id
  AND p.playa_id = p_playa_id;

  IF v_tipo_plaza_id IS NULL THEN
    RAISE EXCEPTION 'La plaza no pertenece a la playa especificada';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.abono a
    WHERE a.plaza_id = p_plaza_id
    AND a.playa_id = p_playa_id
    AND (a.fecha_fin IS NULL OR a.fecha_fin > CURRENT_TIMESTAMP)
    AND a.estado = 'ACTIVO'
  ) THEN
    RAISE EXCEPTION 'La plaza ya tiene un abono activo';
  END IF;

  SELECT get_max_tarifa_mensual_vehiculos(p_playa_id, v_tipo_plaza_id, p_vehiculos)
  INTO v_precio_mensual;

  IF v_precio_mensual IS NULL OR v_precio_mensual = 0 THEN
    RAISE EXCEPTION 'No se encontró tarifa mensual para los vehículos especificados';
  END IF;

  BEGIN
    SELECT a.abonado_id INTO v_abonado_id
    FROM public.abonado a
    WHERE a.dni = p_dni
    LIMIT 1;

    IF FOUND THEN
      v_abonado_existe := TRUE;
      
      UPDATE public.abonado
      SET nombre = p_nombre,
          apellido = p_apellido,
          email = COALESCE(p_email, email),
          telefono = COALESCE(p_telefono, telefono)
      WHERE abonado_id = v_abonado_id;
    ELSE
      INSERT INTO public.abonado (
        nombre,
        apellido,
        email,
        telefono,
        dni
      ) VALUES (
        p_nombre,
        p_apellido,
        p_email,
        p_telefono,
        p_dni
      )
      RETURNING abonado_id INTO v_abonado_id;
    END IF;

    FOR v_vehiculo IN SELECT * FROM jsonb_array_elements(p_vehiculos)
    LOOP
      v_patente := UPPER(v_vehiculo->>'patente');
      v_tipo_vehiculo := (v_vehiculo->>'tipo_vehiculo')::tipo_vehiculo;
      
      INSERT INTO public.vehiculo (patente, tipo_vehiculo)
      VALUES (v_patente, v_tipo_vehiculo)
      ON CONFLICT (patente) DO NOTHING;
      
      INSERT INTO public.abono_vehiculo (
        playa_id,
        plaza_id,
        fecha_hora_inicio,
        patente
      ) VALUES (
        p_playa_id,
        p_plaza_id,
        p_fecha_hora_inicio,
        v_patente
      );
      
      v_vehiculos_insertados := array_append(
        v_vehiculos_insertados,
        jsonb_build_object('patente', v_patente, 'tipo_vehiculo', v_tipo_vehiculo)
      );
    END LOOP;

    INSERT INTO public.abono (
      playa_id,
      plaza_id,
      abonado_id,
      fecha_hora_inicio,
      fecha_fin,
      precio_mensual,
      estado,
      turno_creacion_playa_id,
      turno_creacion_playero_id,
      turno_creacion_fecha_hora_ingreso
    ) VALUES (
      p_playa_id,
      p_plaza_id,
      v_abonado_id,
      p_fecha_hora_inicio,
      NULL,
      v_precio_mensual,
      'ACTIVO',
      p_turno_playa_id,
      p_turno_playero_id,
      p_turno_fecha_hora_ingreso
    );

    UPDATE public.plaza
    SET estado = 'OCUPADA'
    WHERE plaza_id = p_plaza_id;

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
      p_playa_id,
      p_plaza_id,
      p_fecha_hora_inicio,
      CURRENT_DATE,
      CURRENT_DATE + INTERVAL '15 days',
      p_monto_pago,
      p_monto_pago,
      'PAGADA'::boleta_estado
    );

    SELECT COALESCE(MAX(numero_pago), 0) + 1 INTO v_numero_pago
    FROM public.pago
    WHERE playa_id = p_playa_id;

    INSERT INTO public.pago (
      playa_id,
      numero_pago,
      fecha_hora_pago,
      monto_pago,
      metodo_pago,
      playero_id,
      turno_fecha_hora_ingreso
    ) VALUES (
      p_turno_playa_id,
      v_numero_pago,
      NOW(),
      p_monto_pago,
      p_metodo_pago,
      p_turno_playero_id,
      p_turno_fecha_hora_ingreso
    )
    RETURNING pago_id INTO v_pago_id;

    SELECT jsonb_build_object(
      'abonado', jsonb_build_object(
        'abonado_id', a.abonado_id,
        'nombre', a.nombre,
        'apellido', a.apellido,
        'email', a.email,
        'telefono', a.telefono,
        'dni', a.dni,
        'fecha_alta', a.fecha_alta,
        'ya_existia', v_abonado_existe
      ),
      'abono', jsonb_build_object(
        'playa_id', ab.playa_id,
        'plaza_id', ab.plaza_id,
        'fecha_hora_inicio', ab.fecha_hora_inicio,
        'fecha_fin', ab.fecha_fin,
        'precio_mensual', ab.precio_mensual,
        'estado', ab.estado
      ),
      'vehiculos', to_jsonb(v_vehiculos_insertados),
      'boleta_inicial', jsonb_build_object(
        'fecha_generacion', CURRENT_DATE,
        'fecha_vencimiento', CURRENT_DATE + INTERVAL '15 days',
        'monto', p_monto_pago,
        'estado', 'PAGADA'
      ),
      'pago', jsonb_build_object(
        'pago_id', v_pago_id,
        'numero_pago', v_numero_pago,
        'monto', p_monto_pago,
        'metodo_pago', p_metodo_pago
      )
    )
    INTO v_result
    FROM public.abonado a
    JOIN public.abono ab ON ab.abonado_id = a.abonado_id
    WHERE a.abonado_id = v_abonado_id
    ORDER BY ab.fecha_hora_inicio DESC
    LIMIT 1;

    RETURN v_result;

  EXCEPTION
    WHEN OTHERS THEN
      RAISE;
  END;
END;
$$;

COMMENT ON FUNCTION public.create_abonado_with_abono IS 
  'Crea o actualiza un abonado y genera un abono con vehículos, primera boleta pagada y registro de pago. Requiere turno activo y valida que la plaza esté disponible.';

