-- Consulta para contar turnos de Carlos Mendoza
SELECT 
  u.nombre,
  COUNT(*) as total_turnos,
  COUNT(*) FILTER (WHERE t.fecha_hora_salida IS NOT NULL) as turnos_cerrados,
  COUNT(*) FILTER (WHERE t.fecha_hora_salida IS NULL) as turnos_abiertos,
  SUM(
    CASE 
      WHEN t.fecha_hora_salida IS NOT NULL 
      THEN EXTRACT(EPOCH FROM (t.fecha_hora_salida - t.fecha_hora_ingreso)) / 3600 
      ELSE 0 
    END
  ) as total_horas
FROM turno t
INNER JOIN usuario u ON t.playero_id = u.usuario_id
WHERE u.nombre ILIKE '%carlos%mendoza%'
GROUP BY u.nombre, t.playero_id;

-- Detalle de turnos de Carlos Mendoza
SELECT 
  u.nombre as playero,
  p.nombre as playa,
  t.fecha_hora_ingreso,
  t.fecha_hora_salida,
  CASE 
    WHEN t.fecha_hora_salida IS NOT NULL 
    THEN EXTRACT(EPOCH FROM (t.fecha_hora_salida - t.fecha_hora_ingreso)) / 3600 
    ELSE NULL 
  END as duracion_horas
FROM turno t
INNER JOIN usuario u ON t.playero_id = u.usuario_id
INNER JOIN playa p ON t.playa_id = p.playa_id
WHERE u.nombre ILIKE '%carlos%mendoza%'
ORDER BY t.fecha_hora_ingreso DESC;
