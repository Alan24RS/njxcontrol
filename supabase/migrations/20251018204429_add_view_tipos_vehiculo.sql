CREATE OR REPLACE VIEW v_tipos_vehiculo AS
SELECT 
  tvp.playa_id,
  tvp.tipo_vehiculo,
  tvp.estado,
  tvp.fecha_creacion,
  tvp.fecha_modificacion,
  CASE tvp.tipo_vehiculo
    WHEN 'AUTOMOVIL' THEN 'Auto'
    WHEN 'MOTOCICLETA' THEN 'Moto'
    WHEN 'CAMIONETA' THEN 'Camioneta'
  END AS tipo_vehiculo_nombre
FROM tipo_vehiculo_playa tvp;

COMMENT ON VIEW v_tipos_vehiculo IS 'Vista de tipos de vehículo con nombre traducido para ordenamiento alfabético';

