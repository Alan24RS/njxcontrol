-- =====================================================
-- MIGRACIÓN: ACTUALIZAR VISTA PLAYEROS - UN REGISTRO POR PLAYERO
-- =====================================================
-- Actualiza la vista para mostrar un registro por playero con lógica de estados mejorada

-- 1. Reemplazar la vista playeros_agrupados
CREATE OR REPLACE VIEW public.playeros_agrupados AS
WITH playeros_registrados AS (
    -- Playeros ya registrados agrupados por usuario
    SELECT 
        pp.playero_id,
        u.usuario_id,
        u.email,
        u.nombre,
        u.telefono,
        'REGISTRADO' as tipo_registro,
        -- Determinar estado principal según reglas:
        -- ACTIVO si al menos está activo en una playa del dueño
        -- SUSPENDIDO si está suspendido en todas las playas del dueño
        CASE 
            WHEN bool_or(pp.estado = 'ACTIVO') THEN 'ACTIVO'::playero_playa_estado
            ELSE 'SUSPENDIDO'::playero_playa_estado
        END as estado_principal,
        -- Fechas del registro más reciente
        max(pp.fecha_alta) as fecha_alta_principal,
        max(pp.fecha_baja) as fecha_baja_principal,
        -- Motivo de baja si todas están suspendidas
        CASE 
            WHEN bool_or(pp.estado = 'ACTIVO') THEN null
            ELSE (array_agg(pp.motivo_baja ORDER BY pp.fecha_alta DESC NULLS LAST))[1]
        END as motivo_baja_principal,
        max(pp.fecha_creacion) as fecha_creacion_principal,
        max(pp.fecha_modificacion) as fecha_modificacion_principal,
        -- Dueño invitador (tomamos el primero, debería ser el mismo para todas las playas del mismo dueño)
        (array_agg(pp.dueno_invitador_id ORDER BY pp.fecha_alta DESC NULLS LAST))[1] as dueno_invitador_id,
        -- Agregar información de playas asignadas para este dueño
        array_agg(
            json_build_object(
                'playa_id', p.playa_id,
                'nombre', p.nombre,
                'direccion', p.direccion,
                'estado', pp.estado,
                'fecha_alta', pp.fecha_alta,
                'fecha_baja', pp.fecha_baja
            ) ORDER BY pp.fecha_alta DESC NULLS LAST
        ) as playas_asignadas,
        count(pp.playa_id) as total_playas
    FROM public.playero_playa pp
    JOIN public.usuario u ON pp.playero_id = u.usuario_id
    JOIN public.playa p ON pp.playa_id = p.playa_id
    -- Filtrar solo por el dueño actual (se aplicará RLS)
    WHERE p.playa_dueno_id = pp.dueno_invitador_id
    GROUP BY pp.playero_id, u.usuario_id, u.email, u.nombre, u.telefono
),
invitaciones_pendientes AS (
    -- Invitaciones pendientes agrupadas por email
    SELECT 
        null::uuid as playero_id,
        null::uuid as usuario_id,
        pi.email,
        pi.nombre,
        null::text as telefono,
        'INVITACION_PENDIENTE' as tipo_registro,
        'PENDIENTE'::playero_playa_estado as estado_principal,
        null::timestamptz as fecha_alta_principal,
        null::timestamptz as fecha_baja_principal,
        null::text as motivo_baja_principal,
        pi.fecha_invitacion as fecha_creacion_principal,
        pi.fecha_invitacion as fecha_modificacion_principal,
        pi.dueno_invitador_id,
        -- Agregar información de playas de la invitación
        array_agg(
            json_build_object(
                'playa_id', p.playa_id,
                'nombre', p.nombre,
                'direccion', p.direccion,
                'estado', 'PENDIENTE',
                'fecha_alta', null,
                'fecha_baja', null
            )
        ) as playas_asignadas,
        array_length(pi.playas_ids, 1) as total_playas
    FROM public.playero_invitacion pi
    JOIN public.playa p ON p.playa_id = ANY(pi.playas_ids)
    WHERE pi.estado = 'PENDIENTE' 
    AND pi.fecha_expiracion > now()
    -- Filtrar solo invitaciones del dueño actual (se aplicará RLS)
    GROUP BY pi.invitacion_id, pi.dueno_invitador_id, pi.email, pi.nombre, pi.fecha_invitacion, pi.playas_ids
)
-- Unir ambos conjuntos
SELECT 
    playero_id,
    dueno_invitador_id,
    usuario_id,
    email,
    nombre,
    telefono,
    tipo_registro,
    estado_principal as estado,
    fecha_alta_principal as fecha_alta,
    fecha_baja_principal as fecha_baja,
    motivo_baja_principal as motivo_baja,
    fecha_creacion_principal as fecha_creacion,
    fecha_modificacion_principal as fecha_modificacion,
    playas_asignadas,
    total_playas
FROM playeros_registrados

UNION ALL

SELECT 
    playero_id,
    dueno_invitador_id,
    usuario_id,
    email,
    nombre,
    telefono,
    tipo_registro,
    estado_principal as estado,
    fecha_alta_principal as fecha_alta,
    fecha_baja_principal as fecha_baja,
    motivo_baja_principal as motivo_baja,
    fecha_creacion_principal as fecha_creacion,
    fecha_modificacion_principal as fecha_modificacion,
    playas_asignadas,
    total_playas
FROM invitaciones_pendientes;

-- 2. Habilitar RLS en la vista (hereda de las tablas base)
-- La vista ya hereda las políticas RLS de las tablas base

COMMENT ON VIEW public.playeros_agrupados IS 'Vista que muestra un registro por playero con todas sus playas asignadas del dueño actual, incluyendo invitaciones pendientes. El estado se determina según la lógica: ACTIVO si está activo en al menos una playa, SUSPENDIDO si está suspendido en todas, PENDIENTE para invitaciones.';
