CREATE OR REPLACE FUNCTION public.create_abonado_with_abono(
  p_nombre VARCHAR,
  p_apellido VARCHAR,
  p_email VARCHAR,
  p_telefono VARCHAR,
  p_dni VARCHAR,
  p_playa_id UUID,
  p_plaza_id UUID,
  p_fecha_hora_inicio TIMESTAMPTZ,
  p_fecha_fin TIMESTAMPTZ
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_abonado_id INTEGER;
  v_result JSONB;
  v_abonado_existe BOOLEAN := FALSE;
BEGIN
  -- Verificar acceso del playero a la playa
  IF NOT EXISTS (
    SELECT 1 FROM public.playero_playa pp
    WHERE pp.playero_id = auth.uid()
    AND pp.playa_id = p_playa_id
  ) THEN
    RAISE EXCEPTION 'No tiene permisos para crear abonados en esta playa';
  END IF;

  -- Verificar que la plaza pertenece a la playa
  IF NOT EXISTS (
    SELECT 1 FROM public.plaza p
    WHERE p.plaza_id = p_plaza_id
    AND p.playa_id = p_playa_id
  ) THEN
    RAISE EXCEPTION 'La plaza no pertenece a la playa especificada';
  END IF;

  -- Verificar que la plaza está disponible (no tiene abono activo)
  IF EXISTS (
    SELECT 1 FROM public.abono a
    WHERE a.plaza_id = p_plaza_id
    AND a.playa_id = p_playa_id
    AND a.fecha_fin > CURRENT_TIMESTAMP
  ) THEN
    RAISE EXCEPTION 'La plaza ya tiene un abono activo';
  END IF;

  -- Iniciar bloque transaccional
  BEGIN
    -- Verificar si el abonado ya existe por DNI
    SELECT a.abonado_id INTO v_abonado_id
    FROM public.abonado a
    WHERE a.dni = p_dni
    LIMIT 1;

    IF FOUND THEN
      v_abonado_existe := TRUE;
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

    -- Crear el nuevo abono para el abonado (existente o nuevo)
    INSERT INTO public.abono (
      playa_id,
      plaza_id,
      abonado_id,
      fecha_hora_inicio,
      fecha_fin
    ) VALUES (
      p_playa_id,
      p_plaza_id,
      v_abonado_id,
      p_fecha_hora_inicio,
      p_fecha_fin
    );

    -- Construir respuesta JSON
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
        'fecha_fin', ab.fecha_fin
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
