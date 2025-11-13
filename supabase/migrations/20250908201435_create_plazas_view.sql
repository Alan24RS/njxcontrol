-- Vista para plazas con información de playa y tipo de plaza
-- Permite ordenamiento por campos de tablas relacionadas
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
  
  -- Información de la playa
  pl.direccion as playa_direccion,
  pl.nombre as playa_nombre,
  pl.estado as playa_estado,
  
  -- Información del tipo de plaza
  tp.nombre as tipo_plaza_nombre,
  tp.descripcion as tipo_plaza_descripcion
  
FROM plaza p
LEFT JOIN playa pl ON p.playa_id = pl.playa_id
LEFT JOIN tipo_plaza tp ON p.tipo_plaza_id = tp.tipo_plaza_id AND p.playa_id = tp.playa_id
WHERE p.fecha_eliminacion IS NULL;

-- Comentario sobre la vista
COMMENT ON VIEW v_plazas IS 'Vista de plazas con información relacionada de playa y tipo de plaza. Permite ordenamiento por campos de tablas relacionadas.';
