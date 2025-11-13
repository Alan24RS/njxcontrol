-- Actualizar la vista para respetar las políticas RLS
-- Solo mostrar plazas de playas que pertenecen al usuario autenticado
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
WHERE p.fecha_eliminacion IS NULL
  -- Aplicar la misma política RLS que la tabla plaza: solo plazas de playas del dueño
  AND pl.playa_dueno_id = auth.uid()
  AND pl.fecha_eliminacion IS NULL;

-- Habilitar RLS en la vista
ALTER VIEW v_plazas SET (security_invoker = true);

-- Comentario actualizado
COMMENT ON VIEW v_plazas IS 'Vista de plazas con información relacionada de playa y tipo de plaza. Respeta las políticas RLS: solo muestra plazas de playas del usuario autenticado.';
