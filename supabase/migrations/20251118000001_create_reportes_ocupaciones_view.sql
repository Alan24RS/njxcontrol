-- Vista para obtener reporte de ocupaciones segmentadas por turnos
-- Muestra estadísticas de ocupaciones agrupadas por playa y turno
CREATE OR REPLACE VIEW public.reportes_ocupaciones_por_turno AS
SELECT
  t.playa_id,
  p.nombre AS playa_nombre,
  p.direccion,
  t.playero_id,
  u.nombre AS playero_nombre,
  t.fecha_hora_ingreso AS turno_fecha_inicio,
  t.fecha_hora_salida AS turno_fecha_fin,
  (t.fecha_hora_salida IS NULL) AS turno_activo,
  
  -- Estadísticas de ocupaciones
  COUNT(DISTINCT o.ocupacion_id) AS total_ocupaciones,
  COUNT(DISTINCT CASE WHEN o.hora_egreso IS NOT NULL THEN o.ocupacion_id END) AS ocupaciones_finalizadas,
  COUNT(DISTINCT CASE WHEN o.hora_egreso IS NULL THEN o.ocupacion_id END) AS ocupaciones_activas,
  
  -- Recaudación total
  COALESCE(SUM(CASE WHEN pago.monto_pago IS NOT NULL THEN pago.monto_pago ELSE 0 END), 0) AS recaudacion_total,
  
  -- Desglose por método de pago
  COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'metodo_pago', pago.metodo_pago,
        'monto', pago.monto_pago
      ) ORDER BY pago.metodo_pago
    ) FILTER (WHERE pago.numero_pago IS NOT NULL),
    '[]'::jsonb
  ) AS pagos_por_metodo,
  
  -- Detalle de ocupaciones
  COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'ocupacion_id', o.ocupacion_id,
        'plaza_identificador', pl.identificador,
        'patente', o.patente,
        'tipo_vehiculo', o.tipo_vehiculo,
        'modalidad', o.modalidad_ocupacion,
        'hora_ingreso', o.hora_ingreso,
        'hora_egreso', o.hora_egreso,
        'monto_pago', pago.monto_pago,
        'metodo_pago', pago.metodo_pago
      ) ORDER BY o.hora_ingreso DESC
    ) FILTER (WHERE o.ocupacion_id IS NOT NULL),
    '[]'::jsonb
  ) AS ocupaciones

FROM public.turno t
INNER JOIN public.playa p ON t.playa_id = p.playa_id
INNER JOIN public.usuario u ON t.playero_id = u.usuario_id
LEFT JOIN public.ocupacion o 
  ON t.playa_id = o.playa_id 
  AND t.playero_id = o.playero_id 
  AND o.hora_ingreso >= t.fecha_hora_ingreso
  AND (t.fecha_hora_salida IS NULL OR o.hora_ingreso <= t.fecha_hora_salida)
LEFT JOIN public.plaza pl ON o.plaza_id = pl.plaza_id
LEFT JOIN public.pago pago ON o.numero_pago = pago.numero_pago AND o.playa_id = pago.playa_id

GROUP BY 
  t.playa_id,
  p.nombre,
  p.direccion,
  t.playero_id,
  u.nombre,
  t.fecha_hora_ingreso,
  t.fecha_hora_salida

ORDER BY t.fecha_hora_ingreso DESC;

-- Habilitar RLS en la vista
ALTER VIEW public.reportes_ocupaciones_por_turno SET (security_invoker = true);

-- Comentarios
COMMENT ON VIEW public.reportes_ocupaciones_por_turno IS 'Vista que muestra reportes de ocupaciones segmentadas por turnos. Los dueños solo ven turnos de sus playas.';

