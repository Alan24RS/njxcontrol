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
FROM modalidad_ocupacion_playa mop
WHERE mop.fecha_eliminacion IS NULL;

COMMENT ON VIEW v_modalidades_ocupacion IS 
  'Vista de modalidades de ocupacion por playa con etiquetas legibles. Filtra registros eliminados. MENSUAL se gestiona automáticamente para abonos.';

