-- ============================================================================
-- Vista: v_ocupaciones
-- Descripción: Vista con joins para mostrar ocupaciones con información relacionada
-- ============================================================================

DROP VIEW IF EXISTS public.v_ocupaciones;

CREATE VIEW public.v_ocupaciones AS
SELECT 
    -- Datos de ocupación
    o.ocupacion_id,
    o.playa_id,
    o.plaza_id,
    o.playero_id,
    o.patente,
    o.tipo_vehiculo,
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

-- ============================================================================
-- Permisos
-- ============================================================================

-- Playeros pueden ver ocupaciones de sus playas
GRANT SELECT ON public.v_ocupaciones TO authenticated;

-- ============================================================================
-- Comentarios
-- ============================================================================

COMMENT ON VIEW public.v_ocupaciones IS 'Vista con información completa de ocupaciones incluyendo datos de plaza, playero y playa';
