-- =====================================================
-- MIGRACIÓN: CREAR VISTA DE PLAYEROS CON PLAYAS AGRUPADAS
-- =====================================================
-- Crea una vista que agrupa playeros con todas sus playas asignadas

-- 1. Crear vista para playeros agrupados con sus playas
CREATE OR REPLACE VIEW public.playeros_agrupados AS
WITH playeros_registrados AS (
    -- Playeros ya registrados con sus playas
    SELECT 
        pp.playero_id,
        pp.dueno_invitador_id,
        u.usuario_id,
        u.email,
        u.nombre,
        u.telefono,
        'REGISTRADO' as tipo_registro,
        -- Agregar información de estado y fechas (tomamos el más reciente)
        (array_agg(pp.estado ORDER BY pp.fecha_alta DESC NULLS LAST))[1] as estado_principal,
        (array_agg(pp.fecha_alta ORDER BY pp.fecha_alta DESC NULLS LAST))[1] as fecha_alta_principal,
        (array_agg(pp.fecha_baja ORDER BY pp.fecha_alta DESC NULLS LAST))[1] as fecha_baja_principal,
        (array_agg(pp.motivo_baja ORDER BY pp.fecha_alta DESC NULLS LAST))[1] as motivo_baja_principal,
        (array_agg(pp.fecha_creacion ORDER BY pp.fecha_alta DESC NULLS LAST))[1] as fecha_creacion_principal,
        (array_agg(pp.fecha_modificacion ORDER BY pp.fecha_alta DESC NULLS LAST))[1] as fecha_modificacion_principal,
        -- Agregar información de playas asignadas
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
    GROUP BY pp.playero_id, pp.dueno_invitador_id, u.usuario_id, u.email, u.nombre, u.telefono
),
invitaciones_pendientes AS (
    -- Invitaciones pendientes con sus playas
    SELECT 
        null::uuid as playero_id,
        pi.dueno_invitador_id,
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
-- No es necesario crear políticas específicas ya que la vista usa las políticas de las tablas base

-- 3. Crear índices para optimizar consultas en la vista
-- Los índices ya existen en las tablas base, pero podemos crear algunos específicos si es necesario

COMMENT ON VIEW public.playeros_agrupados IS 'Vista que agrupa playeros con todas sus playas asignadas, incluyendo invitaciones pendientes';
