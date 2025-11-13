CREATE OR REPLACE VIEW v_metodos_pago_playa AS
SELECT 
    mpp.playa_id,
    mpp.metodo_pago,
    mpp.estado,
    mpp.fecha_creacion,
    mpp.fecha_modificacion,
    CASE mpp.metodo_pago
        WHEN 'EFECTIVO' THEN 'Efectivo'
        WHEN 'TRANSFERENCIA' THEN 'Transferencia'
        WHEN 'MERCADO_PAGO' THEN 'Mercado Pago'
        ELSE mpp.metodo_pago::text
    END as metodo_pago_label
FROM metodo_pago_playa mpp;

COMMENT ON VIEW v_metodos_pago_playa IS 'Vista de métodos de pago por playa con etiquetas legibles para ordenamiento alfabético.';

