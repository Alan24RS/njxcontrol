CREATE OR REPLACE VIEW v_plazas AS
SELECT 
  p.plaza_id,
  p.identificador,
  p.estado as plaza_estado,
  p.fecha_creacion,
  p.fecha_modificacion,
  p.fecha_eliminacion,
  p.playa_id,
  p.tipo_plaza_id,
  
  pl.direccion as playa_direccion,
  pl.nombre as playa_nombre,
  pl.estado as playa_estado,
  
  tp.nombre as tipo_plaza_nombre,
  tp.descripcion as tipo_plaza_descripcion,
  
  CASE 
    WHEN ab.playa_id IS NOT NULL THEN TRUE
    ELSE FALSE
  END as tiene_abono_vigente,
  
  CASE 
    WHEN ab.playa_id IS NOT NULL THEN (a.nombre || ' ' || a.apellido)
    ELSE NULL
  END as abonado_nombre,
  
  ab.fecha_hora_inicio as abono_fecha_inicio,
  ab.precio_mensual as abono_precio_mensual,
  EXTRACT(DAY FROM ab.fecha_hora_inicio)::INTEGER as abono_dia_cobro
  
FROM plaza p
LEFT JOIN playa pl ON p.playa_id = pl.playa_id
LEFT JOIN tipo_plaza tp ON p.tipo_plaza_id = tp.tipo_plaza_id AND p.playa_id = tp.playa_id
LEFT JOIN abono ab ON 
  p.plaza_id = ab.plaza_id 
  AND p.playa_id = ab.playa_id 
  AND ab.estado = 'ACTIVO' 
  AND (ab.fecha_fin IS NULL OR ab.fecha_fin > CURRENT_TIMESTAMP)
LEFT JOIN abonado a ON ab.abonado_id = a.abonado_id
WHERE p.fecha_eliminacion IS NULL
  AND pl.fecha_eliminacion IS NULL
  AND (
    pl.playa_dueno_id = auth.uid()
    OR EXISTS (
      SELECT 1 
      FROM playero_playa pp
      WHERE pp.playa_id = pl.playa_id
        AND pp.playero_id = auth.uid()
        AND pp.estado = 'ACTIVO'
        AND pp.fecha_baja IS NULL
    )
  );

ALTER VIEW v_plazas SET (security_invoker = true);

COMMENT ON VIEW v_plazas IS 'Vista de plazas con información relacionada de playa, tipo de plaza y abono vigente. Respeta las políticas RLS: muestra plazas de playas donde el usuario es dueño o playero activo asignado. Incluye información de abonos activos.';

