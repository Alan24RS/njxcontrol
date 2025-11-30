DROP FUNCTION IF EXISTS public.update_abono_details(UUID, UUID, TIMESTAMPTZ, VARCHAR, UUID, TEXT) CASCADE;

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
  END IF;

  UPDATE public.abono
  SET plaza_id = v_nueva_plaza_id,
      observaciones = COALESCE(p_observaciones, observaciones)
  WHERE playa_id = p_playa_id
    AND plaza_id = p_plaza_id
    AND fecha_hora_inicio = p_fecha_hora_inicio;

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
    'mensaje', 'Abono actualizado exitosamente'
  ) INTO v_result;

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error al actualizar abono: %', SQLERRM;
END;
$$;

COMMENT ON FUNCTION public.update_abono_details(UUID, UUID, TIMESTAMPTZ, VARCHAR, tipo_vehiculo, UUID, TEXT) IS 
  'Actualiza los detalles administrativos de un abono activo: patente (con registro automático si no existe), plaza u observaciones. No modifica fechas ni realiza cálculos financieros.';

