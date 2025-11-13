-- Migration: Add modalidad_ocupacion and numero_pago to ocupacion table
-- Date: 2025-10-18
-- Description: Agregar campos faltantes para completar funcionalidad de ocupaciones

-- 1. Drop v_ocupaciones view temporalmente
DROP VIEW IF EXISTS v_ocupaciones;

-- 2. Aumentar longitud de patente de 7 a 20 caracteres
DO $$ 
BEGIN
  ALTER TABLE ocupacion ALTER COLUMN patente TYPE VARCHAR(20);
EXCEPTION 
  WHEN others THEN 
    NULL;
END $$;

-- 3. Agregar campo modalidad_ocupacion (ENUM) si no existe
DO $$ 
BEGIN
  ALTER TABLE ocupacion 
    ADD COLUMN modalidad_ocupacion modalidad_ocupacion NOT NULL DEFAULT 'POR_HORA';
EXCEPTION 
  WHEN duplicate_column THEN 
    NULL;
END $$;

-- 4. Agregar campo numero_pago (nullable, para asociar con pagos futuros) si no existe
DO $$ 
BEGIN
  ALTER TABLE ocupacion 
    ADD COLUMN numero_pago INTEGER NULL;
EXCEPTION 
  WHEN duplicate_column THEN 
    NULL;
END $$;

-- 5. Agregar índice para búsquedas por modalidad
CREATE INDEX IF NOT EXISTS idx_ocupacion_modalidad ON ocupacion(modalidad_ocupacion);

-- 6. Agregar índice para búsquedas por pago
CREATE INDEX IF NOT EXISTS idx_ocupacion_numero_pago ON ocupacion(numero_pago) 
  WHERE numero_pago IS NOT NULL;

-- 7. Agregar comentarios
COMMENT ON COLUMN ocupacion.modalidad_ocupacion IS 'Modalidad de cobro: POR_HORA, DIARIA, SEMANAL (MENSUAL fue eliminado en migración posterior)';
COMMENT ON COLUMN ocupacion.numero_pago IS 'Número de pago asociado (FK futura a tabla pago)';

-- 8. Recrear vista v_ocupaciones con los nuevos campos
CREATE OR REPLACE VIEW public.v_ocupaciones AS
SELECT 
    -- Datos de ocupación
    o.ocupacion_id,
    o.playa_id,
    o.plaza_id,
    o.playero_id,
    o.patente,
    o.tipo_vehiculo,
    o.modalidad_ocupacion,
    o.numero_pago,
    o.hora_ingreso,
    o.hora_egreso,
    o.fecha_creacion,
    o.fecha_modificacion,
    
    -- Plaza info
    pl.identificador AS plaza_identificador,
    tp.tipo_plaza_id,
    tp.nombre AS tipo_plaza_nombre,
    pl.estado AS plaza_estado,
    
    -- Playero info
    pf.raw_user_meta_data->>'nombre' AS playero_nombre,
    pf.email AS playero_email,
    
    -- Playa info
    py.nombre AS playa_nombre,
    py.direccion AS playa_direccion,
    
    -- Estado de la ocupación
    CASE 
        WHEN o.hora_egreso IS NULL THEN 'ACTIVO'
        ELSE 'FINALIZADO'
    END AS ocupacion_estado,
    
    -- Duración calculada en minutos
    CASE 
        WHEN o.hora_egreso IS NOT NULL THEN 
            EXTRACT(EPOCH FROM (o.hora_egreso - o.hora_ingreso)) / 60
        ELSE 
            EXTRACT(EPOCH FROM (now() - o.hora_ingreso)) / 60
    END AS duracion_minutos,
    
    -- Duración formateada (HH:MM)
    CASE 
        WHEN o.hora_egreso IS NOT NULL THEN 
            TO_CHAR(
                JUSTIFY_INTERVAL(o.hora_egreso - o.hora_ingreso), 
                'HH24:MI'
            )
        ELSE 
            TO_CHAR(
                JUSTIFY_INTERVAL(now() - o.hora_ingreso), 
                'HH24:MI'
            )
    END AS duracion_formateada
    
FROM public.ocupacion o
JOIN public.plaza pl ON pl.plaza_id = o.plaza_id
JOIN public.tipo_plaza tp ON tp.tipo_plaza_id = pl.tipo_plaza_id
JOIN auth.users pf ON pf.id = o.playero_id
JOIN public.playa py ON py.playa_id = o.playa_id;

-- 9. Permisos
GRANT SELECT ON public.v_ocupaciones TO authenticated;

-- 10. Comentario
COMMENT ON VIEW public.v_ocupaciones IS 'Vista con información completa de ocupaciones incluyendo datos de plaza, playero y playa';
