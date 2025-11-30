DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'abono' 
    AND column_name = 'observaciones'
  ) THEN
    ALTER TABLE public.abono 
    ADD COLUMN observaciones TEXT;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.update_abono_details(
  p_playa_id UUID,
  p_plaza_id UUID,
  p_fecha_hora_inicio TIMESTAMPTZ,
  p_nueva_fecha_fin DATE DEFAULT NULL,
  p_nueva_patente VARCHAR(7) DEFAULT NULL,
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
  v_nueva_fecha_fin DATE;
  v_monto_total DECIMAL(10, 2);
  v_total_pagado DECIMAL(10, 2);
  v_nuevo_saldo DECIMAL(10, 2);
  v_meses_completos INTEGER;
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
  v_nueva_fecha_fin := COALESCE(p_nueva_fecha_fin, v_abono.fecha_fin);

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

  IF v_nueva_fecha_fin IS NOT NULL AND v_nueva_fecha_fin::TIMESTAMPTZ <= v_abono.fecha_hora_inicio THEN
    RAISE EXCEPTION 'La fecha de fin debe ser posterior a la fecha de inicio';
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
      RAISE EXCEPTION 'El vehículo con patente % no existe en el sistema', v_patente;
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

  IF v_nueva_fecha_fin IS NOT NULL AND 
     (v_abono.fecha_fin IS NULL OR v_nueva_fecha_fin != v_abono.fecha_fin) THEN
    
    v_meses_completos := (
      EXTRACT(YEAR FROM v_nueva_fecha_fin)::INTEGER - EXTRACT(YEAR FROM v_abono.fecha_hora_inicio)::INTEGER
    ) * 12 + (
      EXTRACT(MONTH FROM v_nueva_fecha_fin)::INTEGER - EXTRACT(MONTH FROM v_abono.fecha_hora_inicio)::INTEGER
    );
    
    IF EXTRACT(DAY FROM v_nueva_fecha_fin) > EXTRACT(DAY FROM v_abono.fecha_hora_inicio) THEN
       v_meses_completos := v_meses_completos + 1;
    END IF;

    IF v_meses_completos < 1 THEN v_meses_completos := 1; END IF;

    v_monto_total := v_abono.precio_mensual * v_meses_completos;

    SELECT COALESCE(SUM(monto_pagado), 0) INTO v_total_pagado
    FROM public.boleta b
    WHERE b.playa_id = p_playa_id
      AND b.plaza_id = p_plaza_id
      AND b.fecha_hora_inicio_abono = p_fecha_hora_inicio;

    v_nuevo_saldo := v_monto_total - v_total_pagado;
  ELSE
    SELECT COALESCE(SUM(monto_pagado), 0) INTO v_total_pagado
    FROM public.boleta b
    WHERE b.playa_id = p_playa_id
      AND b.plaza_id = p_plaza_id
      AND b.fecha_hora_inicio_abono = p_fecha_hora_inicio;

    IF v_abono.fecha_fin IS NOT NULL THEN
      v_meses_completos := (
        EXTRACT(YEAR FROM v_abono.fecha_fin)::INTEGER - EXTRACT(YEAR FROM v_abono.fecha_hora_inicio)::INTEGER
      ) * 12 + (
        EXTRACT(MONTH FROM v_abono.fecha_fin)::INTEGER - EXTRACT(MONTH FROM v_abono.fecha_hora_inicio)::INTEGER
      );
      IF EXTRACT(DAY FROM v_abono.fecha_fin) > EXTRACT(DAY FROM v_abono.fecha_hora_inicio) THEN
         v_meses_completos := v_meses_completos + 1;
      END IF;
      IF v_meses_completos < 1 THEN v_meses_completos := 1; END IF;
      v_monto_total := v_abono.precio_mensual * v_meses_completos;
    ELSE
      v_monto_total := NULL;
    END IF;

    v_nuevo_saldo := COALESCE(v_monto_total, 0) - v_total_pagado;
  END IF;

  UPDATE public.abono
  SET fecha_fin = v_nueva_fecha_fin,
      plaza_id = v_nueva_plaza_id,
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
    'datos_actualizados', jsonb_build_object(
        'fecha_fin', v_nueva_fecha_fin,
        'monto_total', v_monto_total,
        'nuevo_saldo', v_nuevo_saldo,
        'total_pagado', v_total_pagado,
        'plaza_anterior', p_plaza_id,
        'plaza_nueva', v_nueva_plaza_id,
        'patente_nueva', COALESCE(v_patente, NULL)
    ),
    'mensaje', 'Abono actualizado exitosamente'
  ) INTO v_result;

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error al actualizar abono: %', SQLERRM;
END;
$$;

COMMENT ON FUNCTION public.update_abono_details IS 
  'Actualiza los detalles de un abono activo: fecha de fin, patente o plaza. Recalcula el saldo pendiente si cambia la fecha de fin.';

COMMENT ON COLUMN public.abono.observaciones IS 'Observaciones o notas sobre el abono';
