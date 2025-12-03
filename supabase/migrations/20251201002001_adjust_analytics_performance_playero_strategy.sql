-- Migration: Adjust analytics_performance_playero to mirror turnos module strategy
-- Description:
-- - Filtra turnos por fecha de ingreso dentro del rango (por día), igual que el módulo de turnos
-- - Considera solo turnos cerrados
-- - Aplica exclusión opcional de turnos irregulares (<1h o >12h)
-- - Cuenta turnos sobre el mismo conjunto (evita promedios sesgados)
-- - Evita recortes de duración por periodo; usa duración real del turno
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
  WITH turnos_base AS (
    SELECT
      t.playero_id,
      t.playa_id,
      t.fecha_hora_ingreso,
      t.fecha_hora_salida,
      EXTRACT(EPOCH FROM (t.fecha_hora_salida - t.fecha_hora_ingreso)) / 3600 AS duracion_horas
    FROM turno t
    INNER JOIN playa pl ON pl.playa_id = t.playa_id
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
    LEFT JOIN ocupacion o ON
      o.playa_id = tb.playa_id
      AND o.playero_id = tb.playero_id
      AND o.hora_ingreso >= tb.fecha_hora_ingreso
      AND o.hora_ingreso <= tb.fecha_hora_salida
    LEFT JOIN pago pago_ocu ON pago_ocu.ocupacion_id = o.ocupacion_id
    GROUP BY tb.playero_id, tb.playa_id
  ), boletas_agregadas AS (
    SELECT
      tb.playero_id,
      tb.playa_id,
      COUNT(DISTINCT b.boleta_id) AS boletas_generadas,
      COALESCE(SUM(DISTINCT pago_bol.monto_pago), 0) AS volumen_recaudado_boletas
    FROM turnos_validos tb
    LEFT JOIN boleta b ON
      b.playa_id = tb.playa_id
      AND b.fecha_generacion_boleta BETWEEN tb.fecha_hora_ingreso::date AND tb.fecha_hora_salida::date
    LEFT JOIN pago pago_bol ON pago_bol.boleta_id = b.boleta_id
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
    INNER JOIN usuario u ON ta.playero_id = u.usuario_id
    INNER JOIN playa p ON ta.playa_id = p.playa_id
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
$$;

-- Comment with full signature to avoid ambiguity
COMMENT ON FUNCTION analytics_performance_playero(
  timestamp with time zone,
  timestamp with time zone,
  uuid,
  uuid,
  boolean
) IS 'Aggregates playero performance mirroring turnos module: filters by ingreso day, only closed shifts, optional irregular exclusion, consistent counts for averages.';
