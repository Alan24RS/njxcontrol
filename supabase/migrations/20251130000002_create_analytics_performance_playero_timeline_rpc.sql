-- Migration: Create analytics_performance_playero_timeline RPC function
-- Description: Returns daily time-series data for a specific playero's performance
-- Author: System
-- Date: 2025-11-30

CREATE OR REPLACE FUNCTION analytics_performance_playero_timeline(
  p_playero_id uuid,
  p_fecha_desde timestamp with time zone DEFAULT NULL,
  p_fecha_hasta timestamp with time zone DEFAULT NULL,
  p_intervalo text DEFAULT 'diario'
)
RETURNS TABLE (
  fecha date,
  total_turnos bigint,
  total_horas_trabajadas numeric,
  ocupaciones_cerradas bigint,
  ocupaciones_abiertas bigint,
  volumen_recaudado numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
  WITH turnos_agrupados AS (
    SELECT
      DATE(DATE_TRUNC(date_trunc_format, t.fecha_hora_ingreso)) AS fecha_bucket,
      COUNT(*) AS total_turnos,
      COALESCE(
        SUM(
          EXTRACT(EPOCH FROM (
            LEAST(
              COALESCE(t.fecha_hora_salida, NOW()),
              COALESCE(p_fecha_hasta, COALESCE(t.fecha_hora_salida, NOW()))
            ) - GREATEST(
              t.fecha_hora_ingreso,
              COALESCE(p_fecha_desde, t.fecha_hora_ingreso)
            )
          )) / 3600
        ),
        0
      ) AS total_horas_trabajadas
    FROM turno t
    INNER JOIN playa pl ON pl.playa_id = t.playa_id
    WHERE
      t.playero_id = p_playero_id
      AND pl.playa_dueno_id = auth.uid()
      AND (
        (p_fecha_desde IS NULL OR COALESCE(t.fecha_hora_salida, NOW()) >= p_fecha_desde)
        AND (p_fecha_hasta IS NULL OR t.fecha_hora_ingreso <= p_fecha_hasta)
      )
    GROUP BY DATE(DATE_TRUNC(date_trunc_format, t.fecha_hora_ingreso))
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
$$;

COMMENT ON FUNCTION analytics_performance_playero_timeline IS 'Returns daily time-series performance data for a specific playero including hours worked, occupations closed, and revenue generated';
