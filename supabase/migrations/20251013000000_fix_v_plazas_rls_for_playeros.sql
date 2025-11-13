-- Arreglar la vista v_plazas para que funcione tanto para dueños como para playeros
-- Un usuario puede ver plazas si:
-- 1. Es el dueño de la playa, O
-- 2. Es un playero asignado ACTIVO a la playa (tiene un registro en playero_playa con estado ACTIVO y sin fecha_baja)

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
  AND pl.fecha_eliminacion IS NULL
  -- El usuario puede ver plazas si es dueño O playero de la playa
  AND (
    pl.playa_dueno_id = auth.uid() -- Es el dueño
    OR EXISTS ( -- O es un playero asignado activo
      SELECT 1 
      FROM playero_playa pp
      WHERE pp.playa_id = pl.playa_id
        AND pp.playero_id = auth.uid()
        AND pp.estado = 'ACTIVO'
        AND pp.fecha_baja IS NULL
    )
  );

-- Habilitar RLS en la vista
ALTER VIEW v_plazas SET (security_invoker = true);

-- Comentario actualizado
COMMENT ON VIEW v_plazas IS 'Vista de plazas con información relacionada de playa y tipo de plaza. Respeta las políticas RLS: muestra plazas de playas donde el usuario es dueño o playero activo asignado.';
