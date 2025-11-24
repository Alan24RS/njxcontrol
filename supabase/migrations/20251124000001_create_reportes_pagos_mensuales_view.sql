-- Vista para obtener reporte de pagos mensuales consolidados
-- Combina pagos de ocupaciones y boletas agrupados por mes/año
-- Incluye RLS: los dueños ven todas sus playas, los playeros solo sus propios turnos
CREATE OR REPLACE VIEW public.reportes_pagos_mensuales AS
WITH pagos_ocupaciones AS (
  SELECT
    p.playa_id,
    pl.nombre AS playa_nombre,
    pl.direccion AS playa_direccion,
    pago.turno_playero_id AS playero_id,
    u.nombre AS playero_nombre,
    EXTRACT(YEAR FROM pago.fecha_pago)::INTEGER AS anio,
    EXTRACT(MONTH FROM pago.fecha_pago)::INTEGER AS mes,
    pago.metodo_pago,
    SUM(pago.monto_pago) AS monto_total,
    COUNT(DISTINCT pago.pago_id) AS cantidad_pagos,
    'ocupacion' AS tipo_pago
  FROM public.pago pago
  INNER JOIN public.ocupacion o ON pago.numero_pago = o.numero_pago AND pago.playa_id = o.playa_id
  INNER JOIN public.playa pl ON pago.playa_id = pl.playa_id
  INNER JOIN public.usuario u ON pago.turno_playero_id = u.usuario_id
  WHERE pago.numero_pago IS NOT NULL
    AND pago.fecha_pago IS NOT NULL
  GROUP BY
    p.playa_id,
    pl.nombre,
    pl.direccion,
    pago.turno_playero_id,
    u.nombre,
    anio,
    mes,
    pago.metodo_pago
),
pagos_boletas AS (
  SELECT
    b.playa_id,
    pl.nombre AS playa_nombre,
    pl.direccion AS playa_direccion,
    pago.turno_playero_id AS playero_id,
    u.nombre AS playero_nombre,
    EXTRACT(YEAR FROM pago.fecha_pago)::INTEGER AS anio,
    EXTRACT(MONTH FROM pago.fecha_pago)::INTEGER AS mes,
    pago.metodo_pago,
    SUM(pago.monto_pago) AS monto_total,
    COUNT(DISTINCT pago.pago_id) AS cantidad_pagos,
    'boleta' AS tipo_pago
  FROM public.pago pago
  INNER JOIN public.boleta b ON pago.boleta_id = b.boleta_id
  INNER JOIN public.playa pl ON b.playa_id = pl.playa_id
  INNER JOIN public.usuario u ON pago.turno_playero_id = u.usuario_id
  WHERE pago.boleta_id IS NOT NULL
    AND pago.fecha_pago IS NOT NULL
  GROUP BY
    b.playa_id,
    pl.nombre,
    pl.direccion,
    pago.turno_playero_id,
    u.nombre,
    anio,
    mes,
    pago.metodo_pago
),
pagos_consolidados AS (
  SELECT * FROM pagos_ocupaciones
  UNION ALL
  SELECT * FROM pagos_boletas
)
SELECT
  playa_id,
  playa_nombre,
  playa_direccion,
  playero_id,
  playero_nombre,
  anio,
  mes,
  
  -- Totales generales
  SUM(monto_total) AS recaudacion_total,
  SUM(cantidad_pagos) AS total_pagos,
  
  -- Totales por tipo de pago
  SUM(CASE WHEN tipo_pago = 'ocupacion' THEN monto_total ELSE 0 END) AS recaudacion_ocupaciones,
  SUM(CASE WHEN tipo_pago = 'boleta' THEN monto_total ELSE 0 END) AS recaudacion_boletas,
  SUM(CASE WHEN tipo_pago = 'ocupacion' THEN cantidad_pagos ELSE 0 END) AS cantidad_pagos_ocupaciones,
  SUM(CASE WHEN tipo_pago = 'boleta' THEN cantidad_pagos ELSE 0 END) AS cantidad_pagos_boletas,
  
  -- Desglose por método de pago
  COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'metodo_pago', metodo_pago,
        'monto', monto_total,
        'cantidad', cantidad_pagos,
        'tipo_pago', tipo_pago
      ) ORDER BY metodo_pago, tipo_pago
    ) FILTER (WHERE metodo_pago IS NOT NULL),
    '[]'::jsonb
  ) AS pagos_por_metodo

FROM pagos_consolidados
GROUP BY
  playa_id,
  playa_nombre,
  playa_direccion,
  playero_id,
  playero_nombre,
  anio,
  mes
ORDER BY anio DESC, mes DESC, playa_nombre, playero_nombre;

-- Habilitar RLS en la vista
ALTER VIEW public.reportes_pagos_mensuales SET (security_invoker = true);

-- Comentarios
COMMENT ON VIEW public.reportes_pagos_mensuales IS 
  'Vista que muestra reportes de pagos consolidados (ocupaciones + boletas) agrupados por mes. Los dueños ven todas sus playas, los playeros solo sus propios turnos.';
