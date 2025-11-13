CREATE OR REPLACE VIEW v_modalidades_ocupacion AS
SELECT 
  mop.playa_id,
  mop.modalidad_ocupacion,
  mop.estado,
  mop.fecha_creacion,
  mop.fecha_modificacion,
  mop.fecha_eliminacion,
  CASE mop.modalidad_ocupacion
    WHEN 'DIARIA' THEN 'Diario'
    WHEN 'MENSUAL' THEN 'Mensual'
    WHEN 'POR_HORA' THEN 'Por hora'
    WHEN 'SEMANAL' THEN 'Semanal'
  END AS modalidad_nombre
FROM modalidad_ocupacion_playa mop;

COMMENT ON VIEW v_modalidades_ocupacion IS 'Vista de modalidades de ocupación con nombre traducido para ordenamiento alfabético';

