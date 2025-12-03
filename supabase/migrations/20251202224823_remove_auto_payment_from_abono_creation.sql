-- Modificar create_abonado_with_abono para crear boletas PENDIENTES sin pago automático
-- Esta migración cambia el workflow de creación de abonos para que las boletas
-- se generen como PENDIENTES y los pagos se registren manualmente

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
  v_fecha_generacion_boleta DATE;
  v_boleta_id UUID;
BEGIN
  -- Verificar permisos del playero
  IF NOT EXISTS (
    SELECT 1 FROM public.playero_playa pp
    WHERE pp.playero_id = auth.uid()
    AND pp.playa_id = p_playa_id
  ) THEN
    RAISE EXCEPTION 'No tiene permisos para crear abonados en esta playa';
  END IF;

  -- Verificar que el turno existe y está activo
  IF NOT EXISTS (
    SELECT 1 FROM public.turno t
    WHERE t.playa_id = p_turno_playa_id
    AND t.playero_id = p_turno_playero_id
    AND t.fecha_hora_ingreso = p_turno_fecha_hora_ingreso
    AND t.fecha_hora_salida IS NULL
  ) THEN
    RAISE EXCEPTION 'El turno especificado no existe o ya está cerrado';
  END IF;

  -- Obtener tipo de plaza
  SELECT tipo_plaza_id INTO v_tipo_plaza_id
  FROM public.plaza p
  WHERE p.plaza_id = p_plaza_id
  AND p.playa_id = p_playa_id;

  IF v_tipo_plaza_id IS NULL THEN
    RAISE EXCEPTION 'La plaza no pertenece a la playa especificada';
  END IF;

  -- Verificar que la plaza no tenga un abono activo
  IF EXISTS (
    SELECT 1 FROM public.abono a
    WHERE a.plaza_id = p_plaza_id
    AND a.playa_id = p_playa_id
    AND (a.fecha_fin IS NULL OR a.fecha_fin > CURRENT_TIMESTAMP)
    AND a.estado = 'ACTIVO'
  ) THEN
    RAISE EXCEPTION 'La plaza ya tiene un abono activo';
  END IF;

  -- Calcular precio mensual basado en vehículos
  SELECT get_max_tarifa_abono_vehiculos(p_playa_id, v_tipo_plaza_id, p_vehiculos)
  INTO v_precio_mensual;

  IF v_precio_mensual IS NULL OR v_precio_mensual = 0 THEN
    RAISE EXCEPTION 'No se encontró tarifa de abono para los vehículos especificados';
  END IF;

  -- Buscar o crear abonado
  BEGIN
    SELECT a.abonado_id INTO v_abonado_id
    FROM public.abonado a
    WHERE a.dni = p_dni
    LIMIT 1;

    IF FOUND THEN
      v_abonado_existe := TRUE;
      
      -- Actualizar datos del abonado si ya existe
      UPDATE public.abonado
      SET nombre = p_nombre,
          apellido = p_apellido,
          email = COALESCE(p_email, email),
          telefono = COALESCE(p_telefono, telefono)
      WHERE abonado_id = v_abonado_id;
    ELSE
      -- Crear nuevo abonado
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

    -- Crear el abono
    INSERT INTO public.abono (
      playa_id,
      plaza_id,
      fecha_hora_inicio,
      precio_mensual,
      estado,
      abonado_id,
      turno_creacion_playa_id,
      turno_creacion_playero_id,
      turno_creacion_fecha_hora_ingreso
    ) VALUES (
      p_playa_id,
      p_plaza_id,
      p_fecha_hora_inicio,
      v_precio_mensual,
      'ACTIVO',
      v_abonado_id,
      p_turno_playa_id,
      p_turno_playero_id,
      p_turno_fecha_hora_ingreso
    );

    -- Insertar vehículos
    FOR v_vehiculo IN SELECT * FROM jsonb_array_elements(p_vehiculos)
    LOOP
      v_patente := UPPER(v_vehiculo->>'patente');
      v_tipo_vehiculo := (v_vehiculo->>'tipo_vehiculo')::tipo_vehiculo;
      
      -- Insertar vehículo si no existe
      INSERT INTO public.vehiculo (patente, tipo_vehiculo)
      VALUES (v_patente, v_tipo_vehiculo)
      ON CONFLICT (patente) DO NOTHING;
      
      -- Asociar vehículo al abono
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

    -- Crear boleta PENDIENTE (sin pago automático)
    v_fecha_generacion_boleta := CURRENT_DATE;

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
      v_fecha_generacion_boleta,
      v_fecha_generacion_boleta + INTERVAL '15 days',
      p_monto_pago,
      0, -- Sin pago inicial
      'PENDIENTE'::boleta_estado -- Estado inicial PENDIENTE
    )
    RETURNING boleta_id INTO v_boleta_id;

    -- NO CREAR PAGO AUTOMÁTICAMENTE
    -- El pago se registrará manualmente usando registrar_pago_boleta()

    -- Construir resultado
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
        'precio_mensual', ab.precio_mensual,
        'estado', ab.estado,
        'vehiculos', v_vehiculos_insertados
      ),
      'boleta', jsonb_build_object(
        'boleta_id', v_boleta_id,
        'fecha_generacion', v_fecha_generacion_boleta,
        'fecha_vencimiento', v_fecha_generacion_boleta + INTERVAL '15 days',
        'monto', p_monto_pago,
        'monto_pagado', 0,
        'estado', 'PENDIENTE'
      )
    ) INTO v_result
    FROM public.abonado a
    CROSS JOIN public.abono ab
    WHERE a.abonado_id = v_abonado_id
    AND ab.playa_id = p_playa_id
    AND ab.plaza_id = p_plaza_id
    AND ab.fecha_hora_inicio = p_fecha_hora_inicio;

    RETURN v_result;

  EXCEPTION
    WHEN OTHERS THEN
      RAISE EXCEPTION 'Error al crear abonado y abono: %', SQLERRM;
  END;
END;
$$;

COMMENT ON FUNCTION public.create_abonado_with_abono IS 
  'Crea o actualiza un abonado y genera un nuevo abono con su boleta inicial en estado PENDIENTE. El pago se debe registrar manualmente.';
