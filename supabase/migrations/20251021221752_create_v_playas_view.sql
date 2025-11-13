DROP VIEW IF EXISTS v_playas;

CREATE VIEW v_playas AS
SELECT
  p.playa_id,
  p.playa_dueno_id,
  p.nombre,
  p.direccion,
  p.horario,
  p.descripcion,
  p.latitud,
  p.longitud,
  p.ciudad_id,
  p.estado,
  p.fecha_creacion,
  p.fecha_modificacion,
  p.fecha_eliminacion,
  c.nombre AS ciudad_nombre,
  c.provincia AS ciudad_provincia
FROM playa p
LEFT JOIN ciudad c ON p.ciudad_id = c.ciudad_id;

COMMENT ON VIEW v_playas IS 'Vista de playas con información relacionada de ciudad para facilitar ordenamiento y filtrado. Hereda las políticas RLS de la tabla playa.';

