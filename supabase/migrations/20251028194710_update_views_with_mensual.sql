DROP VIEW IF EXISTS v_modalidades_ocupacion;
CREATE OR REPLACE VIEW v_modalidades_ocupacion AS
SELECT 
    mop.playa_id,
    mop.modalidad_ocupacion,
    mop.estado,
    mop.fecha_creacion,
    mop.fecha_modificacion,
    CASE mop.modalidad_ocupacion
        WHEN 'POR_HORA' THEN 'Por hora'
        WHEN 'DIARIA' THEN 'Diario'
        WHEN 'SEMANAL' THEN 'Semanal'
        WHEN 'MENSUAL' THEN 'Mensual'
    END as modalidad_label
FROM modalidad_ocupacion_playa mop;

DROP VIEW IF EXISTS v_tarifas;
CREATE OR REPLACE VIEW v_tarifas AS
SELECT 
  t.playa_id,
  t.tipo_plaza_id,
  t.modalidad_ocupacion,
  t.tipo_vehiculo,
  t.precio_base,
  t.fecha_creacion,
  t.fecha_modificacion,
  tp.nombre as tipo_plaza_nombre,
  tp.descripcion as tipo_plaza_descripcion,
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

COMMENT ON TYPE modalidad_ocupacion IS 
  'Modalidades de ocupacion del sistema: POR_HORA, DIARIA, SEMANAL, MENSUAL. MENSUAL solo se usa automáticamente para abonos, no puede ser seleccionada manualmente en ocupaciones.';

COMMENT ON VIEW v_modalidades_ocupacion IS 
  'Vista de modalidades de ocupacion por playa con etiquetas legibles. MENSUAL se gestiona automáticamente para abonos.';

