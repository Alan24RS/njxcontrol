drop extension if exists "pg_net";

drop function if exists "public"."actualizar_boletas_vencidas"();

drop view if exists "public"."v_boletas";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.analytics_performance_playero(p_fecha_desde timestamp with time zone DEFAULT NULL::timestamp with time zone, p_fecha_hasta timestamp with time zone DEFAULT NULL::timestamp with time zone, p_playa_id uuid DEFAULT NULL::uuid, p_playero_id uuid DEFAULT NULL::uuid, p_excluir_irregulares boolean DEFAULT false)
 RETURNS TABLE(playero_id uuid, playero_nombre text, playa_id uuid, playa_nombre text, total_turnos bigint, total_horas_trabajadas numeric, total_dias_trabajados bigint, ocupaciones_abiertas bigint, ocupaciones_cerradas bigint, total_ocupaciones bigint, volumen_recaudado_ocupaciones numeric, boletas_generadas bigint, volumen_recaudado_boletas numeric, volumen_recaudado_total numeric, ticket_promedio numeric, fecha_primer_turno timestamp with time zone, fecha_ultimo_turno timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  RETURN QUERY
  WITH turnos_base AS (
    SELECT
      t.playero_id,
      t.playa_id,
      t.fecha_hora_ingreso,
      t.fecha_hora_salida,
      EXTRACT(EPOCH FROM (t.fecha_hora_salida - t.fecha_hora_ingreso)) / 3600 AS duracion_horas
    FROM public.turno t
    INNER JOIN public.playa pl ON pl.playa_id = t.playa_id
    WHERE pl.playa_dueno_id = auth.uid()
      AND t.fecha_hora_salida IS NOT NULL -- solo cerrados
      AND (p_playa_id IS NULL OR t.playa_id = p_playa_id)
      AND (p_playero_id IS NULL OR t.playero_id = p_playero_id)
      -- filtro por DIA de ingreso, como módulo de turnos
      AND (p_fecha_desde IS NULL OR DATE(t.fecha_hora_ingreso) >= p_fecha_desde::date)
      AND (p_fecha_hasta IS NULL OR DATE(t.fecha_hora_ingreso) <= p_fecha_hasta::date)
  ), turnos_validos AS (
    SELECT *
    FROM turnos_base
    WHERE (NOT p_excluir_irregulares) OR (duracion_horas >= 1 AND duracion_horas <= 12)
  ), turnos_agregados AS (
    SELECT
      tb.playero_id,
      tb.playa_id,
      COUNT(*) AS total_turnos,
      SUM(tb.duracion_horas) AS total_horas_trabajadas,
      COUNT(DISTINCT DATE(tb.fecha_hora_ingreso)) AS total_dias_trabajados,
      MIN(tb.fecha_hora_ingreso) AS fecha_primer_turno,
      MAX(tb.fecha_hora_ingreso) AS fecha_ultimo_turno
    FROM turnos_validos tb
    GROUP BY tb.playero_id, tb.playa_id
  ), ocupaciones_agregadas AS (
    SELECT
      tb.playero_id,
      tb.playa_id,
      COUNT(DISTINCT o.ocupacion_id) FILTER (WHERE o.estado = 'ACTIVO') AS ocupaciones_abiertas,
      COUNT(DISTINCT o.ocupacion_id) FILTER (WHERE o.estado = 'FINALIZADO') AS ocupaciones_cerradas,
      COUNT(DISTINCT o.ocupacion_id) AS total_ocupaciones,
      COALESCE(SUM(DISTINCT pago_ocu.monto_pago), 0) AS volumen_recaudado_ocupaciones
    FROM turnos_validos tb
    LEFT JOIN public.ocupacion o ON
      o.playa_id = tb.playa_id
      AND o.playero_id = tb.playero_id
      AND o.hora_ingreso >= tb.fecha_hora_ingreso
      AND o.hora_ingreso <= tb.fecha_hora_salida
    LEFT JOIN public.pago pago_ocu ON pago_ocu.ocupacion_id = o.ocupacion_id
    GROUP BY tb.playero_id, tb.playa_id
  ), boletas_agregadas AS (
    SELECT
      tb.playero_id,
      tb.playa_id,
      COUNT(DISTINCT b.boleta_id) AS boletas_generadas,
      COALESCE(SUM(DISTINCT pago_bol.monto_pago), 0) AS volumen_recaudado_boletas
    FROM turnos_validos tb
    LEFT JOIN public.boleta b ON
      b.playa_id = tb.playa_id
      AND b.fecha_generacion_boleta BETWEEN tb.fecha_hora_ingreso::date AND tb.fecha_hora_salida::date
    LEFT JOIN public.pago pago_bol ON pago_bol.boleta_id = b.boleta_id
    GROUP BY tb.playero_id, tb.playa_id
  ), performance_data AS (
    SELECT
      ta.playero_id,
      u.nombre AS playero_nombre,
      ta.playa_id,
      p.nombre AS playa_nombre,
      ta.total_turnos,
      COALESCE(ta.total_horas_trabajadas, 0) AS total_horas_trabajadas,
      ta.total_dias_trabajados,
      COALESCE(oa.ocupaciones_abiertas, 0) AS ocupaciones_abiertas,
      COALESCE(oa.ocupaciones_cerradas, 0) AS ocupaciones_cerradas,
      COALESCE(oa.total_ocupaciones, 0) AS total_ocupaciones,
      COALESCE(oa.volumen_recaudado_ocupaciones, 0) AS volumen_recaudado_ocupaciones,
      COALESCE(ba.boletas_generadas, 0) AS boletas_generadas,
      COALESCE(ba.volumen_recaudado_boletas, 0) AS volumen_recaudado_boletas,
      ta.fecha_primer_turno,
      ta.fecha_ultimo_turno
    FROM turnos_agregados ta
    INNER JOIN public.usuario u ON ta.playero_id = u.usuario_id
    INNER JOIN public.playa p ON ta.playa_id = p.playa_id
    LEFT JOIN ocupaciones_agregadas oa ON oa.playero_id = ta.playero_id AND oa.playa_id = ta.playa_id
    LEFT JOIN boletas_agregadas ba ON ba.playero_id = ta.playero_id AND ba.playa_id = ta.playa_id
  )
  SELECT
    pd.playero_id,
    pd.playero_nombre,
    pd.playa_id,
    pd.playa_nombre,
    pd.total_turnos,
    ROUND(pd.total_horas_trabajadas, 2) AS total_horas_trabajadas,
    pd.total_dias_trabajados,
    pd.ocupaciones_abiertas,
    pd.ocupaciones_cerradas,
    pd.total_ocupaciones,
    pd.volumen_recaudado_ocupaciones,
    pd.boletas_generadas,
    pd.volumen_recaudado_boletas,
    (pd.volumen_recaudado_ocupaciones + pd.volumen_recaudado_boletas) AS volumen_recaudado_total,
    CASE
      WHEN (pd.ocupaciones_cerradas + pd.boletas_generadas) > 0 THEN ROUND(
        (pd.volumen_recaudado_ocupaciones + pd.volumen_recaudado_boletas) / NULLIF((pd.ocupaciones_cerradas + pd.boletas_generadas), 0),
        2
      )
      ELSE 0
    END AS ticket_promedio,
    pd.fecha_primer_turno,
    pd.fecha_ultimo_turno
  FROM performance_data pd
  ORDER BY (pd.volumen_recaudado_ocupaciones + pd.volumen_recaudado_boletas) DESC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_turnos_detalle(p_fecha_desde date DEFAULT NULL::date, p_fecha_hasta date DEFAULT NULL::date, p_playa_id uuid DEFAULT NULL::uuid, p_playero_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE("turnoId" uuid, "playeroId" uuid, "playeroNombre" text, "playaId" uuid, "playaNombre" text, "fechaHoraIngreso" timestamp with time zone, "fechaHoraSalida" timestamp with time zone, "duracionHoras" numeric, "recaudacionTotal" numeric, "ocupacionesCerradas" bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    t.id AS "turnoId",
    t.playero_id AS "playeroId",
    u.nombre AS "playeroNombre",
    t.playa_id AS "playaId",
    pl.nombre AS "playaNombre",
    t.fecha_hora_ingreso AS "fechaHoraIngreso",
    t.fecha_hora_salida AS "fechaHoraSalida",
    CASE
      WHEN t.fecha_hora_salida IS NOT NULL THEN
        EXTRACT(EPOCH FROM (t.fecha_hora_salida - t.fecha_hora_ingreso)) / 3600.0
      ELSE
        EXTRACT(EPOCH FROM (NOW() - t.fecha_hora_ingreso)) / 3600.0
    END AS "duracionHoras",
    COALESCE(SUM(p.monto), 0) AS "recaudacionTotal",
    COUNT(DISTINCT CASE WHEN o.estado = 'finalizado' THEN o.id END) AS "ocupacionesCerradas"
  FROM turno t
  INNER JOIN usuario u ON u.usuario_id = t.playero_id
  INNER JOIN playa pl ON pl.playa_id = t.playa_id
  LEFT JOIN ocupacion o ON o.turno_apertura_id = t.id
  LEFT JOIN pago p ON p.ocupacion_id = o.id
  WHERE
    (p_fecha_desde IS NULL OR DATE(t.fecha_hora_ingreso) >= p_fecha_desde)
    AND (p_fecha_hasta IS NULL OR DATE(t.fecha_hora_ingreso) <= p_fecha_hasta)
    AND (p_playa_id IS NULL OR t.playa_id = p_playa_id)
    AND (p_playero_id IS NULL OR t.playero_id = p_playero_id)
  GROUP BY
    t.id,
    t.playero_id,
    u.nombre,
    t.playa_id,
    pl.nombre,
    t.fecha_hora_ingreso,
    t.fecha_hora_salida
  ORDER BY
    t.fecha_hora_ingreso DESC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.analytics_performance_playero_timeline(p_playero_id uuid, p_fecha_desde timestamp with time zone DEFAULT NULL::timestamp with time zone, p_fecha_hasta timestamp with time zone DEFAULT NULL::timestamp with time zone, p_intervalo text DEFAULT 'diario'::text)
 RETURNS TABLE(fecha date, total_turnos bigint, total_horas_trabajadas numeric, ocupaciones_cerradas bigint, ocupaciones_abiertas bigint, volumen_recaudado numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  date_trunc_format text;
BEGIN
  -- Determine grouping format based on intervalo
  CASE p_intervalo
    WHEN 'semanal' THEN
      date_trunc_format := 'week';
    WHEN 'mensual' THEN
      date_trunc_format := 'month';
    ELSE
      date_trunc_format := 'day';
  END CASE;

  RETURN QUERY
  WITH date_range AS (
    -- Generate all dates in the range
    SELECT GENERATE_SERIES(
      COALESCE(p_fecha_desde::date, (SELECT MIN(DATE(fecha_hora_ingreso)) FROM turno WHERE playero_id = p_playero_id)),
      COALESCE(p_fecha_hasta::date, (SELECT MAX(DATE(COALESCE(fecha_hora_salida, NOW()))) FROM turno WHERE playero_id = p_playero_id)),
      '1 day'::interval
    )::date AS fecha
  ),
  turnos_expandidos AS (
    -- Expand turnos across multiple days if they span midnight
    SELECT
      t.turno_id,
      d.fecha AS fecha_trabajo,
      t.fecha_hora_ingreso,
      COALESCE(t.fecha_hora_salida, NOW()) AS fecha_hora_salida_calculada,
      -- Calculate hours for this specific day
      EXTRACT(EPOCH FROM (
        LEAST(
          COALESCE(t.fecha_hora_salida, NOW()),
          (d.fecha + INTERVAL '1 day')::timestamp with time zone
        ) - GREATEST(
          t.fecha_hora_ingreso,
          d.fecha::timestamp with time zone
        )
      )) / 3600 AS horas_dia
    FROM turno t
    INNER JOIN playa pl ON pl.playa_id = t.playa_id
    CROSS JOIN LATERAL GENERATE_SERIES(
      DATE(t.fecha_hora_ingreso),
      DATE(COALESCE(t.fecha_hora_salida, NOW())),
      '1 day'::interval
    ) AS d(fecha)
    WHERE
      t.playero_id = p_playero_id
      AND pl.playa_dueno_id = auth.uid()
      AND (
        (p_fecha_desde IS NULL OR COALESCE(t.fecha_hora_salida, NOW()) >= p_fecha_desde)
        AND (p_fecha_hasta IS NULL OR t.fecha_hora_ingreso <= p_fecha_hasta)
      )
      -- Ensure we only count hours on valid days
      AND d.fecha >= COALESCE(p_fecha_desde::date, DATE(t.fecha_hora_ingreso))
      AND d.fecha <= COALESCE(p_fecha_hasta::date, DATE(COALESCE(t.fecha_hora_salida, NOW())))
  ),
  turnos_agrupados AS (
    SELECT
      DATE(DATE_TRUNC(date_trunc_format, fecha_trabajo::timestamp)) AS fecha_bucket,
      COUNT(DISTINCT turno_id) AS total_turnos,
      COALESCE(SUM(horas_dia), 0) AS total_horas_trabajadas
    FROM turnos_expandidos
    WHERE horas_dia > 0  -- Only count positive hours
    GROUP BY DATE(DATE_TRUNC(date_trunc_format, fecha_trabajo::timestamp))
  ),
  ocupaciones_agrupadas AS (
    SELECT
      DATE(DATE_TRUNC(date_trunc_format, o.hora_ingreso)) AS fecha_bucket,
      COUNT(*) FILTER (WHERE o.estado = 'FINALIZADO') AS ocupaciones_cerradas,
      COUNT(*) FILTER (WHERE o.estado = 'ACTIVO') AS ocupaciones_abiertas,
      COALESCE(SUM(pago.monto_pago) FILTER (WHERE o.estado = 'FINALIZADO'), 0) AS volumen_recaudado_ocupaciones
    FROM ocupacion o
    INNER JOIN playa pl ON pl.playa_id = o.playa_id
    LEFT JOIN pago ON pago.ocupacion_id = o.ocupacion_id
    WHERE
      o.playero_id = p_playero_id
      AND pl.playa_dueno_id = auth.uid()
      AND (p_fecha_desde IS NULL OR o.hora_ingreso >= p_fecha_desde)
      AND (p_fecha_hasta IS NULL OR o.hora_ingreso <= p_fecha_hasta)
    GROUP BY DATE(DATE_TRUNC(date_trunc_format, o.hora_ingreso))
  ),
  boletas_agrupadas AS (
    SELECT
      DATE(DATE_TRUNC(date_trunc_format, b.fecha_generacion_boleta::timestamp)) AS fecha_bucket,
      COALESCE(SUM(pago.monto_pago), 0) AS volumen_recaudado_boletas
    FROM boleta b
    INNER JOIN playa pl ON pl.playa_id = b.playa_id
    LEFT JOIN pago ON pago.boleta_id = b.boleta_id
    WHERE
      pl.playa_dueno_id = auth.uid()
      AND (p_fecha_desde IS NULL OR b.fecha_generacion_boleta >= p_fecha_desde::date)
      AND (p_fecha_hasta IS NULL OR b.fecha_generacion_boleta <= p_fecha_hasta::date)
      AND EXISTS (
        SELECT 1 FROM turno t
        WHERE t.playero_id = p_playero_id
          AND t.playa_id = b.playa_id
          AND b.fecha_generacion_boleta = DATE(t.fecha_hora_ingreso)
      )
    GROUP BY DATE(DATE_TRUNC(date_trunc_format, b.fecha_generacion_boleta::timestamp))
  ),
  all_dates AS (
    SELECT DISTINCT fecha_bucket AS fecha FROM turnos_agrupados
    UNION
    SELECT DISTINCT fecha_bucket AS fecha FROM ocupaciones_agrupadas
    UNION
    SELECT DISTINCT fecha_bucket AS fecha FROM boletas_agrupadas
  )
  SELECT
    ad.fecha,
    COALESCE(ta.total_turnos, 0) AS total_turnos,
    ROUND(COALESCE(ta.total_horas_trabajadas, 0), 2) AS total_horas_trabajadas,
    COALESCE(oa.ocupaciones_cerradas, 0) AS ocupaciones_cerradas,
    COALESCE(oa.ocupaciones_abiertas, 0) AS ocupaciones_abiertas,
    ROUND(COALESCE(oa.volumen_recaudado_ocupaciones, 0) + COALESCE(ba.volumen_recaudado_boletas, 0), 2) AS volumen_recaudado
  FROM all_dates ad
  LEFT JOIN turnos_agrupados ta ON ad.fecha = ta.fecha_bucket
  LEFT JOIN ocupaciones_agrupadas oa ON ad.fecha = oa.fecha_bucket
  LEFT JOIN boletas_agrupadas ba ON ad.fecha = ba.fecha_bucket
  ORDER BY ad.fecha;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_abonado_with_abono(p_nombre character varying, p_apellido character varying, p_email character varying, p_telefono character varying, p_dni character varying, p_playa_id uuid, p_plaza_id uuid, p_fecha_hora_inicio timestamp with time zone, p_vehiculos jsonb, p_turno_playa_id uuid, p_turno_playero_id uuid, p_turno_fecha_hora_ingreso timestamp with time zone, p_metodo_pago public.metodo_pago DEFAULT NULL::public.metodo_pago, p_monto_pago numeric DEFAULT NULL::numeric)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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

    -- Determinar estado y monto pagado de la boleta según si se proporciona pago
    IF p_metodo_pago IS NOT NULL AND p_monto_pago IS NOT NULL AND p_monto_pago > 0 THEN
      v_monto_pagado := p_monto_pago;
      v_estado_boleta := 'PAGADA'::boleta_estado;
    ELSE
      v_monto_pagado := 0;
      v_estado_boleta := 'PENDIENTE'::boleta_estado;
    END IF;

    -- Crear boleta inicial
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
      v_monto_pagado,
      v_estado_boleta
    )
    RETURNING boleta_id INTO v_boleta_id;

    -- Si se proporcionó método de pago, registrar el pago automáticamente
    IF p_metodo_pago IS NOT NULL AND p_monto_pago IS NOT NULL AND p_monto_pago > 0 THEN
      INSERT INTO public.pago (
        playa_id,
        plaza_id,
        fecha_hora_inicio_abono,
        fecha_generacion_boleta,
        monto,
        metodo_pago,
        turno_playa_id,
        turno_playero_id,
        turno_fecha_hora_ingreso
      ) VALUES (
        p_playa_id,
        p_plaza_id,
        p_fecha_hora_inicio,
        v_fecha_generacion_boleta,
        p_monto_pago,
        p_metodo_pago,
        p_turno_playa_id,
        p_turno_playero_id,
        p_turno_fecha_hora_ingreso
      );
    END IF;

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
      'boleta_inicial', jsonb_build_object(
        'boleta_id', v_boleta_id,
        'fecha_generacion', v_fecha_generacion_boleta,
        'fecha_vencimiento', v_fecha_generacion_boleta + INTERVAL '15 days',
        'monto', p_monto_pago,
        'monto_pagado', v_monto_pagado,
        'estado', v_estado_boleta
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
$function$
;

CREATE OR REPLACE FUNCTION public.generar_boletas_mensuales()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_abono RECORD;
  v_dia_actual INTEGER;
  v_dia_facturacion INTEGER := 1; -- DÍA FIJO: 1 de cada mes
  v_boletas_generadas INTEGER := 0;
  v_errores JSONB[] := '{}';
BEGIN
  v_dia_actual := EXTRACT(DAY FROM CURRENT_DATE)::INTEGER;

  -- Solo ejecutar el día de facturación configurado
  IF v_dia_actual != v_dia_facturacion THEN
    RETURN jsonb_build_object(
      'mensaje', 'No es día de facturación',
      'dia_actual', v_dia_actual,
      'dia_facturacion', v_dia_facturacion,
      'boletas_generadas', 0
    );
  END IF;

  -- Generar boletas para todos los abonos activos
  FOR v_abono IN 
    SELECT 
      a.playa_id,
      a.plaza_id,
      a.fecha_hora_inicio,
      a.precio_mensual,
      a.abonado_id
    FROM public.abono a
    WHERE a.estado = 'ACTIVO'
      AND a.fecha_fin IS NULL
      AND a.precio_mensual IS NOT NULL
  LOOP
    -- Verificar que no exista ya una boleta para este mes
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
          monto,
          monto_pagado,
          estado
        ) VALUES (
          v_abono.playa_id,
          v_abono.plaza_id,
          v_abono.fecha_hora_inicio,
          CURRENT_DATE,
          CURRENT_DATE + INTERVAL '15 days',
          v_abono.precio_mensual,
          0,
          'PENDIENTE'::boleta_estado
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
  END LOOP;

  RETURN jsonb_build_object(
    'fecha_ejecucion', CURRENT_DATE,
    'dia_facturacion', v_dia_facturacion,
    'boletas_generadas', v_boletas_generadas,
    'errores', v_errores
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.notificar_boletas_proximas_vencer()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_boleta RECORD;
  v_notificaciones_enviadas INTEGER := 0;
  v_dias_alerta INTEGER := 3; -- Alertar 3 días antes
BEGIN
  -- Buscar boletas PENDIENTES que vencen en 3 días
  FOR v_boleta IN 
    SELECT 
      b.playa_id,
      b.plaza_id,
      b.fecha_hora_inicio_abono,
      b.fecha_generacion_boleta,
      b.numero_de_boleta,
      b.fecha_vencimiento_boleta,
      b.monto,
      b.monto_pagado,
      (b.monto - b.monto_pagado) as deuda_pendiente,
      ab.abonado_id,
      a.nombre,
      a.apellido,
      a.email,
      a.telefono,
      pl.identificador as plaza_identificador,
      p.nombre as playa_nombre
    FROM public.boleta b
    JOIN public.abono ab ON 
      b.playa_id = ab.playa_id 
      AND b.plaza_id = ab.plaza_id 
      AND b.fecha_hora_inicio_abono = ab.fecha_hora_inicio
    JOIN public.abonado a ON ab.abonado_id = a.abonado_id
    JOIN public.plaza pl ON b.plaza_id = pl.plaza_id
    JOIN public.playa p ON b.playa_id = p.playa_id
    WHERE b.estado = 'PENDIENTE'::boleta_estado
      AND b.fecha_vencimiento_boleta = CURRENT_DATE + v_dias_alerta
      AND (b.monto - b.monto_pagado) > 0
  LOOP
    -- Aquí integrarías con tu sistema de notificaciones
    -- Por ahora, registramos en una tabla de log o enviamos a un webhook
    
    -- Ejemplo: Insertar en tabla de notificaciones pendientes
    -- INSERT INTO notificaciones_pendientes (...)
    
    v_notificaciones_enviadas := v_notificaciones_enviadas + 1;
    
    -- Log para debugging
    RAISE NOTICE 'Notificación: Boleta % de % % vence en % días. Deuda: $%',
      v_boleta.numero_de_boleta,
      v_boleta.nombre,
      v_boleta.apellido,
      v_dias_alerta,
      v_boleta.deuda_pendiente;
  END LOOP;

  RETURN jsonb_build_object(
    'fecha_ejecucion', CURRENT_DATE,
    'dias_alerta', v_dias_alerta,
    'notificaciones_enviadas', v_notificaciones_enviadas
  );
END;
$function$
;

create or replace view "public"."v_boletas" as  SELECT b.playa_id,
    b.plaza_id,
    b.fecha_hora_inicio_abono,
    b.fecha_generacion_boleta,
    b.numero_de_boleta,
    b.fecha_vencimiento_boleta,
    b.monto,
    b.monto_pagado,
    (b.monto - b.monto_pagado) AS deuda_pendiente,
    b.estado,
    public.calculate_boleta_estado(b.monto, b.monto_pagado, b.fecha_vencimiento_boleta) AS estado_calculado,
    ab.abonado_id,
    (((a.nombre)::text || ' '::text) || (a.apellido)::text) AS abonado_nombre,
    a.dni AS abonado_dni,
    pl.identificador AS plaza_identificador,
    py.nombre AS playa_nombre
   FROM ((((public.boleta b
     JOIN public.abono ab ON (((b.playa_id = ab.playa_id) AND (b.plaza_id = ab.plaza_id) AND (b.fecha_hora_inicio_abono = ab.fecha_hora_inicio))))
     JOIN public.abonado a ON ((ab.abonado_id = a.abonado_id)))
     JOIN public.plaza pl ON ((b.plaza_id = pl.plaza_id)))
     JOIN public.playa py ON ((b.playa_id = py.playa_id)));



