DROP FUNCTION IF EXISTS public.update_abono_details(UUID, UUID, TIMESTAMPTZ, DATE, VARCHAR, UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.update_abono_details(UUID, UUID, TIMESTAMPTZ, DATE, VARCHAR, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.update_abono_details(UUID, UUID, TIMESTAMPTZ, VARCHAR, tipo_vehiculo, UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.update_abono_details(UUID, UUID, TIMESTAMPTZ, VARCHAR, UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.update_abono_details(UUID, UUID, TIMESTAMPTZ) CASCADE;

CREATE OR REPLACE FUNCTION public.update_abono_details(
  p_playa_id UUID,
  p_plaza_id UUID,
  p_fecha_hora_inicio TIMESTAMPTZ,
  p_nueva_patente VARCHAR(7) DEFAULT NULL,
  p_nuevo_tipo_vehiculo tipo_vehiculo DEFAULT NULL,
  p_nueva_plaza_id UUID DEFAULT NULL,
  p_observaciones TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_abono RECORD;
  v_nueva_plaza_id UUID;
  v_result JSONB;
  v_vehiculo_existe BOOLEAN;
  v_patente VARCHAR(7);
  v_tipo_vehiculo_actual tipo_vehiculo;
  v_tipo_vehiculo_nuevo tipo_vehiculo;
  v_tipo_plaza_id BIGINT;
  v_nuevo_precio_mensual DECIMAL(10, 2);
  v_precio_anterior DECIMAL(10, 2);
  v_mensaje TEXT;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.playero_playa pp
    WHERE pp.playero_id = auth.uid()
    AND pp.playa_id = p_playa_id
  ) THEN
    RAISE EXCEPTION 'No tiene permisos para editar abonos en esta playa';
  END IF;

  SELECT * INTO v_abono
  FROM public.abono a
  WHERE a.playa_id = p_playa_id
    AND a.plaza_id = p_plaza_id
    AND a.fecha_hora_inicio = p_fecha_hora_inicio
  FOR UPDATE;

  IF v_abono IS NULL THEN
    RAISE EXCEPTION 'No se encontró el abono especificado';
  END IF;

  IF v_abono.estado != 'ACTIVO' THEN
    RAISE EXCEPTION 'Solo se pueden editar abonos activos';
  END IF;

  v_nueva_plaza_id := COALESCE(p_nueva_plaza_id, v_abono.plaza_id);
  v_precio_anterior := v_abono.precio_mensual;

  IF v_nueva_plaza_id != v_abono.plaza_id THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.plaza p
      WHERE p.plaza_id = v_nueva_plaza_id
      AND p.playa_id = p_playa_id
    ) THEN
      RAISE EXCEPTION 'La nueva plaza no pertenece a la playa especificada';
    END IF;

    IF EXISTS (
      SELECT 1 FROM public.abono a
      WHERE a.plaza_id = v_nueva_plaza_id
      AND a.playa_id = p_playa_id
      AND a.estado = 'ACTIVO'
      AND (a.fecha_fin IS NULL OR a.fecha_fin > CURRENT_TIMESTAMP)
      AND NOT (
        a.playa_id = p_playa_id
        AND a.plaza_id = p_plaza_id
        AND a.fecha_hora_inicio = p_fecha_hora_inicio
      )
    ) THEN
      RAISE EXCEPTION 'La nueva plaza ya tiene un abono activo';
    END IF;
  END IF;

  SELECT tipo_plaza_id INTO v_tipo_plaza_id
  FROM public.plaza
  WHERE plaza_id = v_nueva_plaza_id
    AND playa_id = p_playa_id;

  IF v_tipo_plaza_id IS NULL THEN
    RAISE EXCEPTION 'No se encontró el tipo de plaza para la plaza especificada';
  END IF;

  SELECT tipo_vehiculo INTO v_tipo_vehiculo_actual
  FROM public.abono_vehiculo av
  JOIN public.vehiculo v ON av.patente = v.patente
  WHERE av.playa_id = p_playa_id
    AND av.plaza_id = p_plaza_id
    AND av.fecha_hora_inicio = p_fecha_hora_inicio
  LIMIT 1;

  IF p_nueva_patente IS NOT NULL AND p_nueva_patente != '' THEN
    v_patente := UPPER(p_nueva_patente);
    
    IF NOT (v_patente ~ '^(?:[A-Z]{3}[0-9]{3}|[A-Z]{2}[0-9]{3}[A-Z]{2})$') THEN
      RAISE EXCEPTION 'Formato de patente inválido';
    END IF;

    SELECT EXISTS (
      SELECT 1 FROM public.vehiculo v WHERE v.patente = v_patente
    ) INTO v_vehiculo_existe;

    IF NOT v_vehiculo_existe THEN
      IF p_nuevo_tipo_vehiculo IS NULL THEN
        RAISE EXCEPTION 'Para registrar un vehículo nuevo debe indicar el tipo';
      END IF;

      INSERT INTO public.vehiculo (patente, tipo_vehiculo)
      VALUES (v_patente, p_nuevo_tipo_vehiculo)
      ON CONFLICT (patente) DO NOTHING;
      
      v_tipo_vehiculo_nuevo := p_nuevo_tipo_vehiculo;
    ELSE
      IF p_nuevo_tipo_vehiculo IS NOT NULL THEN
        UPDATE public.vehiculo
        SET tipo_vehiculo = p_nuevo_tipo_vehiculo
        WHERE patente = v_patente;
        v_tipo_vehiculo_nuevo := p_nuevo_tipo_vehiculo;
      ELSE
        SELECT tipo_vehiculo INTO v_tipo_vehiculo_nuevo
        FROM public.vehiculo
        WHERE patente = v_patente;
      END IF;
    END IF;

    IF v_tipo_vehiculo_actual IS DISTINCT FROM v_tipo_vehiculo_nuevo THEN
      SELECT precio_base INTO v_nuevo_precio_mensual
      FROM public.tarifa
      WHERE playa_id = p_playa_id
        AND tipo_plaza_id = v_tipo_plaza_id
        AND modalidad_ocupacion = 'ABONO'
        AND tipo_vehiculo = v_tipo_vehiculo_nuevo;

      IF v_nuevo_precio_mensual IS NULL THEN
        RAISE EXCEPTION 'No existe tarifa configurada para este tipo de vehículo en esta plaza';
      END IF;
    END IF;

    DELETE FROM public.abono_vehiculo av
    WHERE av.playa_id = p_playa_id
      AND av.plaza_id = p_plaza_id
      AND av.fecha_hora_inicio = p_fecha_hora_inicio;

    INSERT INTO public.abono_vehiculo (
      playa_id, plaza_id, fecha_hora_inicio, patente
    ) VALUES (
      p_playa_id, p_plaza_id, p_fecha_hora_inicio, v_patente
    );
  ELSIF p_nuevo_tipo_vehiculo IS NOT NULL AND v_tipo_vehiculo_actual IS NOT NULL THEN
    IF v_tipo_vehiculo_actual IS DISTINCT FROM p_nuevo_tipo_vehiculo THEN
      SELECT patente INTO v_patente
      FROM public.abono_vehiculo
      WHERE playa_id = p_playa_id
        AND plaza_id = p_plaza_id
        AND fecha_hora_inicio = p_fecha_hora_inicio
      LIMIT 1;

      IF v_patente IS NOT NULL THEN
        UPDATE public.vehiculo
        SET tipo_vehiculo = p_nuevo_tipo_vehiculo
        WHERE patente = v_patente;

        SELECT precio_base INTO v_nuevo_precio_mensual
        FROM public.tarifa
        WHERE playa_id = p_playa_id
          AND tipo_plaza_id = v_tipo_plaza_id
          AND modalidad_ocupacion = 'ABONO'
          AND tipo_vehiculo = p_nuevo_tipo_vehiculo;

        IF v_nuevo_precio_mensual IS NULL THEN
          RAISE EXCEPTION 'No existe tarifa configurada para este tipo de vehículo en esta plaza';
        END IF;
      END IF;
    END IF;
  END IF;

  IF v_nuevo_precio_mensual IS NOT NULL THEN
    UPDATE public.abono
    SET plaza_id = v_nueva_plaza_id,
        precio_mensual = v_nuevo_precio_mensual,
        observaciones = COALESCE(p_observaciones, observaciones)
    WHERE playa_id = p_playa_id
      AND plaza_id = p_plaza_id
      AND fecha_hora_inicio = p_fecha_hora_inicio;

    v_mensaje := format('Abono actualizado. Nuevo precio mensual: $%s', v_nuevo_precio_mensual);
  ELSE
    UPDATE public.abono
    SET plaza_id = v_nueva_plaza_id,
        observaciones = COALESCE(p_observaciones, observaciones)
    WHERE playa_id = p_playa_id
      AND plaza_id = p_plaza_id
      AND fecha_hora_inicio = p_fecha_hora_inicio;

    v_mensaje := 'Abono actualizado exitosamente';
  END IF;

  IF v_nueva_plaza_id != p_plaza_id THEN
    UPDATE public.abono_vehiculo
    SET plaza_id = v_nueva_plaza_id
    WHERE playa_id = p_playa_id
      AND plaza_id = p_plaza_id
      AND fecha_hora_inicio = p_fecha_hora_inicio;

    UPDATE public.boleta
    SET plaza_id = v_nueva_plaza_id
    WHERE playa_id = p_playa_id
      AND plaza_id = p_plaza_id
      AND fecha_hora_inicio_abono = p_fecha_hora_inicio;
  END IF;

  SELECT jsonb_build_object(
    'success', true,
    'abono_id', jsonb_build_object(
      'playa_id', p_playa_id,
      'plaza_id', v_nueva_plaza_id,
      'fecha_hora_inicio', p_fecha_hora_inicio
    ),
    'mensaje', v_mensaje,
    'precio_mensual_anterior', v_precio_anterior,
    'precio_mensual_nuevo', v_nuevo_precio_mensual
  ) INTO v_result;

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error al actualizar abono: %', SQLERRM;
END;
$$;

COMMENT ON FUNCTION public.update_abono_details(UUID, UUID, TIMESTAMPTZ, VARCHAR, tipo_vehiculo, UUID, TEXT) IS 
  'Actualiza los detalles administrativos de un abono activo: patente (con registro automático si no existe), plaza u observaciones. Si cambia el tipo de vehículo, actualiza el precio_mensual según la tarifa vigente.';

