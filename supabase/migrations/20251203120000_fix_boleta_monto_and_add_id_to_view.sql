-- Corregir bug: usar precio_mensual en lugar de p_monto_pago para el monto de la boleta
-- Agregar boleta_id a la vista v_boletas

-- 1. Eliminar vista existente y recrearla con boleta_id
DROP VIEW IF EXISTS v_boletas;

CREATE VIEW v_boletas AS
SELECT 
  b.boleta_id,
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

COMMENT ON VIEW v_boletas IS 'Vista enriquecida de boletas con boleta_id e información de abonado, plaza y estado calculado';

-- 2. Corregir función create_abonado_with_abono para usar v_precio_mensual como monto de la boleta
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
  p_metodo_pago metodo_pago DEFAULT NULL,
  p_monto_pago DECIMAL(10, 2) DEFAULT NULL
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
  v_monto_pagado DECIMAL(10, 2);
  v_estado_boleta boleta_estado;
  v_numero_pago INTEGER;
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
      -- Insertar nuevo abonado
      INSERT INTO public.abonado (nombre, apellido, email, telefono, dni)
      VALUES (p_nombre, p_apellido, p_email, p_telefono, p_dni)
      RETURNING abonado_id INTO v_abonado_id;
    END IF;
  EXCEPTION
    WHEN unique_violation THEN
      SELECT a.abonado_id INTO v_abonado_id
      FROM public.abonado a
      WHERE a.dni = p_dni
      LIMIT 1;
      
      v_abonado_existe := TRUE;
  END;

  -- Crear abono
  INSERT INTO public.abono (
    playa_id,
    plaza_id,
    fecha_hora_inicio,
    abonado_id,
    precio_mensual,
    estado
  ) VALUES (
    p_playa_id,
    p_plaza_id,
    p_fecha_hora_inicio,
    v_abonado_id,
    v_precio_mensual,
    'ACTIVO'::abono_estado
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

  -- Determinar estado y monto pagado de la boleta según si se proporciona pago
  IF p_metodo_pago IS NOT NULL AND p_monto_pago IS NOT NULL AND p_monto_pago > 0 THEN
    v_monto_pagado := p_monto_pago;
    -- Si se paga completo, marcar como PAGADA, sino PENDIENTE
    IF p_monto_pago >= v_precio_mensual THEN
      v_estado_boleta := 'PAGADA'::boleta_estado;
    ELSE
      v_estado_boleta := 'PENDIENTE'::boleta_estado;
    END IF;
  ELSE
    v_monto_pagado := 0;
    v_estado_boleta := 'PENDIENTE'::boleta_estado;
  END IF;

  -- Crear boleta inicial con el precio mensual como monto (FIX: antes usaba p_monto_pago)
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
    v_precio_mensual,  -- FIX: usar v_precio_mensual en lugar de p_monto_pago
    v_monto_pagado,
    v_estado_boleta
  )
  RETURNING boleta_id INTO v_boleta_id;

  -- Si se proporcionó método de pago, registrar el pago automáticamente
  IF p_metodo_pago IS NOT NULL AND p_monto_pago IS NOT NULL AND p_monto_pago > 0 THEN
    -- Generar siguiente numero_pago para esta playa
    SELECT COALESCE(MAX(numero_pago), 0) + 1 
    INTO v_numero_pago
    FROM public.pago
    WHERE playa_id = p_playa_id;

    INSERT INTO public.pago (
      playa_id,
      numero_pago,
      boleta_id,
      fecha_hora_pago,
      monto_pago,
      metodo_pago,
      playero_id,
      turno_playa_id,
      turno_playero_id,
      turno_fecha_hora_ingreso
    ) VALUES (
      p_playa_id,
      v_numero_pago,
      v_boleta_id,
      CURRENT_TIMESTAMP,
      p_monto_pago,
      p_metodo_pago,
      auth.uid(),
      p_turno_playa_id,
      p_turno_playero_id,
      p_turno_fecha_hora_ingreso
    );
  END IF;

  -- Retornar datos del abonado y abono creado
  v_result := jsonb_build_object(
    'abonado', jsonb_build_object(
      'abonado_id', v_abonado_id,
      'nombre', p_nombre,
      'apellido', p_apellido,
      'email', p_email,
      'telefono', p_telefono,
      'dni', p_dni,
      'fecha_alta', (SELECT fecha_alta FROM public.abonado WHERE abonado_id = v_abonado_id),
      'ya_existia', v_abonado_existe
    ),
    'abono', jsonb_build_object(
      'playa_id', p_playa_id,
      'plaza_id', p_plaza_id,
      'fecha_hora_inicio', p_fecha_hora_inicio,
      'precio_mensual', v_precio_mensual,
      'estado', 'ACTIVO',
      'fecha_fin', NULL
    ),
    'vehiculos', v_vehiculos_insertados,
    'boleta_inicial', jsonb_build_object(
      'boleta_id', v_boleta_id,
      'fecha_generacion', v_fecha_generacion_boleta,
      'fecha_vencimiento', v_fecha_generacion_boleta + INTERVAL '15 days',
      'monto', v_precio_mensual,
      'monto_pagado', v_monto_pagado,
      'estado', v_estado_boleta
    )
  );

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.create_abonado_with_abono IS 
  'Crea un abonado con su abono inicial y boleta. Si se proporciona método de pago, registra el pago automáticamente. FIX: usa precio_mensual como monto de boleta.';
