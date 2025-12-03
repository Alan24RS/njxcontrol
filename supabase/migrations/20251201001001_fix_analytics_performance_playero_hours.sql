-- Migration: Fix analytics_performance_playero hours calculation
-- Description: 
--   1. Only count closed shifts (with fecha_hora_salida)
--   2. Add parameter to exclude irregular shifts (< 1h or > 12h)
--   3. Fix hours calculation to use actual shift duration
-- Author: System
-- Date: 2025-12-01

CREATE OR REPLACE FUNCTION analytics_performance_playero(
  p_fecha_desde timestamp with time zone DEFAULT NULL,
  p_fecha_hasta timestamp with time zone DEFAULT NULL,
  p_playa_id uuid DEFAULT NULL,
  p_playero_id uuid DEFAULT NULL,
  p_excluir_irregulares boolean DEFAULT FALSE
)
RETURNS TABLE (
  playero_id uuid,
  playero_nombre text,
  playa_id uuid,
  playa_nombre text,
  total_turnos bigint,
  total_horas_trabajadas numeric,
  total_dias_trabajados bigint,
  ocupaciones_abiertas bigint,
  ocupaciones_cerradas bigint,
  total_ocupaciones bigint,
  volumen_recaudado_ocupaciones numeric,
  boletas_generadas bigint,
  volumen_recaudado_boletas numeric,
  volumen_recaudado_total numeric,
  ticket_promedio numeric,
  fecha_primer_turno timestamp with time zone,
  fecha_ultimo_turno timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH turnos_filtrados AS (
    SELECT
      t.playero_id,
      t.playa_id,
      t.fecha_hora_ingreso,
      t.fecha_hora_salida,
      -- Calcular duración en horas (solo para turnos cerrados)
      CASE 
        WHEN t.fecha_hora_salida IS NOT NULL THEN
          EXTRACT(EPOCH FROM (t.fecha_hora_salida - t.fecha_hora_ingreso)) / 3600
        ELSE NULL
      END AS duracion_horas,
      -- límites del período para recorte
      p_fecha_desde AS periodo_desde,
      p_fecha_hasta AS periodo_hasta
    FROM turno t
    INNER JOIN playa pl ON pl.playa_id = t.playa_id
    WHERE
      -- RLS: Solo playas del usuario autenticado
      pl.playa_dueno_id = auth.uid()
      AND (p_playa_id IS NULL OR t.playa_id = p_playa_id)
      AND (p_playero_id IS NULL OR t.playero_id = p_playero_id)
      -- Solo turnos cerrados
      AND t.fecha_hora_salida IS NOT NULL
      -- incluir turnos que SOLAPAN el período seleccionado
      AND (
        (p_fecha_desde IS NULL OR t.fecha_hora_salida >= p_fecha_desde)
        AND (p_fecha_hasta IS NULL OR t.fecha_hora_ingreso <= p_fecha_hasta)
      )
  ),
  turnos_validos AS (
    SELECT
      tf.*
    FROM turnos_filtrados tf
    WHERE
      -- Si p_excluir_irregulares es true, filtrar turnos irregulares
      (NOT p_excluir_irregulares) OR (
        tf.duracion_horas IS NOT NULL 
        AND tf.duracion_horas >= 1 
        AND tf.duracion_horas <= 12
      )
  ),
  performance_data AS (
    SELECT
      tf.playero_id,
      u.nombre AS playero_nombre,
      tf.playa_id,
      p.nombre AS playa_nombre,
      COUNT(DISTINCT tf.fecha_hora_ingreso) AS total_turnos,
      COALESCE(
        SUM(
          EXTRACT(EPOCH FROM (
            LEAST(
              tf.fecha_hora_salida,
              COALESCE(tf.periodo_hasta, tf.fecha_hora_salida)
            ) - GREATEST(
              tf.fecha_hora_ingreso,
              COALESCE(tf.periodo_desde, tf.fecha_hora_ingreso)
            )
          )) / 3600
        ),
        0
      ) AS total_horas_trabajadas,
      COUNT(DISTINCT DATE(tf.fecha_hora_ingreso)) AS total_dias_trabajados,
      COALESCE(COUNT(DISTINCT o.ocupacion_id) FILTER (WHERE o.estado = 'ACTIVO'), 0) AS ocupaciones_abiertas,
      COALESCE(COUNT(DISTINCT o.ocupacion_id) FILTER (WHERE o.estado = 'FINALIZADO'), 0) AS ocupaciones_cerradas,
      COALESCE(COUNT(DISTINCT o.ocupacion_id), 0) AS total_ocupaciones,
      COALESCE(SUM(pago_ocu.monto_pago), 0) AS volumen_recaudado_ocupaciones,
      COALESCE(COUNT(DISTINCT b.boleta_id), 0) AS boletas_generadas,
      COALESCE(SUM(pago_bol.monto_pago), 0) AS volumen_recaudado_boletas,
      MIN(tf.fecha_hora_ingreso) AS fecha_primer_turno,
      MAX(tf.fecha_hora_ingreso) AS fecha_ultimo_turno
    FROM turnos_validos tf
    INNER JOIN usuario u ON tf.playero_id = u.usuario_id
    INNER JOIN playa p ON tf.playa_id = p.playa_id
    LEFT JOIN ocupacion o ON
      o.playa_id = tf.playa_id
      AND o.playero_id = tf.playero_id
      AND o.hora_ingreso >= tf.fecha_hora_ingreso
      AND o.hora_ingreso <= tf.fecha_hora_salida
    LEFT JOIN pago pago_ocu ON
      pago_ocu.ocupacion_id = o.ocupacion_id
    LEFT JOIN boleta b ON
      b.playa_id = tf.playa_id
      AND b.fecha_generacion_boleta >= tf.fecha_hora_ingreso::date
      AND b.fecha_generacion_boleta <= tf.fecha_hora_salida::date
    LEFT JOIN pago pago_bol ON
      pago_bol.boleta_id = b.boleta_id
    GROUP BY tf.playero_id, u.nombre, tf.playa_id, p.nombre
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
      WHEN (pd.ocupaciones_cerradas + pd.boletas_generadas) > 0
      THEN ROUND(
        (pd.volumen_recaudado_ocupaciones + pd.volumen_recaudado_boletas) /
        NULLIF((pd.ocupaciones_cerradas + pd.boletas_generadas), 0),
        2
      )
      ELSE 0
    END AS ticket_promedio,
    pd.fecha_primer_turno,
    pd.fecha_ultimo_turno
  FROM performance_data pd
  ORDER BY (pd.volumen_recaudado_ocupaciones + pd.volumen_recaudado_boletas) DESC;
END;
$$;

-- Specify full function signature to avoid name ambiguity
COMMENT ON FUNCTION analytics_performance_playero(
  timestamp with time zone,
  timestamp with time zone,
  uuid,
  uuid,
  boolean
) IS 'Returns aggregated performance metrics for playeros. Only includes closed shifts. Supports excluding irregular shifts (< 1h or > 12h) via p_excluir_irregulares parameter.';
