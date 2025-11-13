-- Vista para tarifas con información de tipo de plaza
-- Permite ordenamiento por campos de tablas relacionadas y enums
CREATE OR REPLACE VIEW v_tarifas AS
SELECT 
  t.playa_id,
  t.tipo_plaza_id,
  t.modalidad_ocupacion,
  t.tipo_vehiculo,
  t.precio_base,
  t.fecha_creacion,
  t.fecha_modificacion,
  
  -- Información del tipo de plaza
  tp.nombre as tipo_plaza_nombre,
  tp.descripcion as tipo_plaza_descripcion,
  
  -- Campos calculados para ordenamiento de enums
  CASE t.modalidad_ocupacion
    WHEN 'POR_HORA' THEN 1
    WHEN 'DIARIA' THEN 2
    WHEN 'SEMANAL' THEN 3
    WHEN 'MENSUAL' THEN 4
    ELSE 999
  END as modalidad_ocupacion_order,
  
  CASE t.tipo_vehiculo
    WHEN 'AUTOMOVIL' THEN 1
    WHEN 'MOTOCICLETA' THEN 2
    WHEN 'CAMIONETA' THEN 3
    ELSE 999
  END as tipo_vehiculo_order
  
FROM tarifa t
LEFT JOIN tipo_plaza tp ON t.tipo_plaza_id = tp.tipo_plaza_id AND t.playa_id = tp.playa_id
WHERE tp.fecha_eliminacion IS NULL;

-- Comentario sobre la vista
COMMENT ON VIEW v_tarifas IS 'Vista de tarifas con información relacionada de tipo de plaza. Incluye campos de ordenamiento para enums modalidad_ocupacion y tipo_vehiculo.';
