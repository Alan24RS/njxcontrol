-- ============================================================================
-- MIGRACIÓN: Agregar campo playero_cierre_id a tabla ocupacion
-- Descripción: Permite distinguir entre el playero que abre y el que cierra
--              una ocupación, manteniendo trazabilidad completa de acciones
--
-- NOTAS SOBRE OCUPACIONES HISTÓRICAS:
-- - playero_id (apertura): NOT NULL, todas las ocupaciones deben tenerlo
-- - playero_cierre_id: NULLABLE, será NULL para:
--   * Ocupaciones activas (aún no finalizadas)
--   * Ocupaciones finalizadas ANTES de esta migración (datos históricos)
--   * Ocupaciones donde el playero de cierre fue eliminado (ON DELETE SET NULL)
--
-- La vista v_ocupaciones usa LEFT JOIN para ambos playeros, permitiendo que
-- ocupaciones históricas se muestren correctamente incluso si falta información.
-- El frontend maneja estos casos mostrando "Sin información" cuando corresponde.
-- ============================================================================

-- 1. Agregar columna playero_cierre_id a la tabla ocupacion
DO $$
BEGIN
  ALTER TABLE public.ocupacion
    ADD COLUMN playero_cierre_id UUID;
EXCEPTION
  WHEN duplicate_column THEN
    NULL;
END $$;

-- 2. Agregar foreign key constraint
DO $$
BEGIN
  ALTER TABLE public.ocupacion
    ADD CONSTRAINT ocupacion_playero_cierre_id_fkey 
      FOREIGN KEY (playero_cierre_id) 
      REFERENCES auth.users(id) 
      ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;

-- 3. Agregar índice para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_ocupacion_playero_cierre_id 
  ON public.ocupacion(playero_cierre_id);

-- 4. Agregar comentario a la columna
COMMENT ON COLUMN public.ocupacion.playero_cierre_id IS 
  'ID del playero que registró el egreso (NULL = ocupación activa o ocupación finalizada antes de esta migración)';

-- 5. Actualizar función finalizar_ocupacion_y_registrar_pago para guardar playero_cierre_id
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
  v_es_playero_activo boolean;
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

  IF v_ocupacion.playero_id <> p_playero_id THEN
    IF v_owner <> p_playero_id THEN
      SELECT es_playero_de_playa(p_playero_id, v_playa_id)
      INTO v_es_playero_activo;
      
      IF NOT v_es_playero_activo THEN
        RAISE LOG 'finalizar_ocupacion: PERMISSION_DENIED (%, no es playero activo de playa %)', p_playero_id, v_playa_id;
        RETURN jsonb_build_object('ok', false, 'error', 'PERMISSION_DENIED');
      END IF;
    END IF;
  END IF;

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

  v_monto_final := p_monto_manual;

  PERFORM pg_advisory_xact_lock(hashtext('pago_' || v_playa_id::text));

  SELECT COALESCE(MAX(numero_pago), 0) + 1
  INTO v_numero_pago
  FROM public.pago
  WHERE playa_id = v_playa_id;

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
  ) VALUES (
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
  RETURNING pago_id INTO v_pago_id;

  UPDATE public.ocupacion
  SET hora_egreso = v_now,
      numero_pago = v_numero_pago,
      estado = 'FINALIZADO'::public.ocupacion_estado,
      playero_cierre_id = p_playero_id,
      fecha_modificacion = v_now
  WHERE ocupacion_id = p_ocupacion_id;

  INSERT INTO public.pago_event_log (
    pago_id,
    evento,
    payload
  ) VALUES (
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

  RAISE LOG 'finalizar_ocupacion: SUCCESS (%, pago %)', p_ocupacion_id, v_pago_id;

  RETURN jsonb_build_object(
    'ok', true,
    'pagoId', v_pago_id,
    'numeroPago', v_numero_pago,
    'monto', v_monto_final,
    'horaEgreso', v_now
  );
END;
$$;

COMMENT ON FUNCTION public.finalizar_ocupacion_y_registrar_pago IS 
'Función que permite a cualquier playero activo de la playa finalizar ocupaciones. Guarda el playero_cierre_id para trazabilidad completa.';

-- 6. Actualizar vista v_ocupaciones para incluir información del playero que cierra
DROP VIEW IF EXISTS public.v_ocupaciones;

CREATE VIEW public.v_ocupaciones AS
SELECT
    o.ocupacion_id,
    o.playa_id,
    o.plaza_id,
    o.playero_id,
    o.playero_cierre_id,
    o.patente,
    o.tipo_vehiculo,
    o.modalidad_ocupacion,
    o.numero_pago,
    o.hora_ingreso,
    o.hora_egreso,
    o.fecha_creacion,
    o.fecha_modificacion,

    pl.identificador AS plaza_identificador,
    tp.tipo_plaza_id,
    tp.nombre AS tipo_plaza_nombre,
    pl.estado AS plaza_estado,

    u.nombre AS playero_nombre,
    u.email AS playero_email,

    u_cierre.nombre AS playero_cierre_nombre,
    u_cierre.email AS playero_cierre_email,

    py.nombre AS playa_nombre,
    py.direccion AS playa_direccion,

    CASE
        WHEN o.hora_egreso IS NULL THEN 'ACTIVO'
        ELSE 'FINALIZADO'
    END AS ocupacion_estado,

    CASE
        WHEN o.hora_egreso IS NOT NULL THEN
            EXTRACT(EPOCH FROM (o.hora_egreso - o.hora_ingreso)) / 60
        ELSE
            EXTRACT(EPOCH FROM (now() - o.hora_ingreso)) / 60
    END AS duracion_minutos,

    CASE
        WHEN o.hora_egreso IS NOT NULL THEN
            TO_CHAR(
                JUSTIFY_INTERVAL(o.hora_egreso - o.hora_ingreso),
                'HH24:MI'
            )
        ELSE
            TO_CHAR(
                JUSTIFY_INTERVAL(now() - o.hora_ingreso),
                'HH24:MI'
            )
    END AS duracion_formateada

FROM public.ocupacion o
JOIN public.plaza pl ON pl.plaza_id = o.plaza_id
JOIN public.tipo_plaza tp
  ON tp.tipo_plaza_id = pl.tipo_plaza_id
  AND tp.playa_id = pl.playa_id
LEFT JOIN public.usuario u ON u.usuario_id = o.playero_id
LEFT JOIN public.usuario u_cierre ON u_cierre.usuario_id = o.playero_cierre_id
JOIN public.playa py ON py.playa_id = o.playa_id
WHERE pl.fecha_eliminacion IS NULL
  AND tp.fecha_eliminacion IS NULL
  AND py.fecha_eliminacion IS NULL;

GRANT SELECT ON public.v_ocupaciones TO authenticated;

ALTER VIEW public.v_ocupaciones SET (security_invoker = true);

COMMENT ON VIEW public.v_ocupaciones IS 'Vista con información completa de ocupaciones incluyendo datos de plaza, playero que abre, playero que cierra y playa. Usa security_invoker=true para respetar las políticas RLS de las tablas base.';

