DROP VIEW IF EXISTS v_playeros;

CREATE VIEW v_playeros AS
WITH playeros_registrados AS (
    SELECT 
        pp.playero_id,
        pp.dueno_invitador_id,
        u.usuario_id,
        u.email,
        u.nombre AS usuario_nombre,
        u.telefono AS usuario_telefono,
        'REGISTRADO'::text as tipo_registro,
        public.obtener_estado_consolidado_playero(pp.playero_id, pp.dueno_invitador_id) as estado,
        MIN(pp.fecha_alta) as fecha_alta,
        MAX(pp.fecha_baja) as fecha_baja,
        string_agg(DISTINCT pp.motivo_baja, '; ') as motivo_baja,
        MIN(pp.fecha_creacion) as fecha_creacion,
        MAX(pp.fecha_modificacion) as fecha_modificacion,
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
    SELECT 
        null::uuid as playero_id,
        pi.dueno_invitador_id,
        null::uuid as usuario_id,
        pi.email,
        pi.nombre AS usuario_nombre,
        null::text as usuario_telefono,
        'INVITACION_PENDIENTE'::text as tipo_registro,
        'PENDIENTE'::text as estado,
        null::timestamptz as fecha_alta,
        null::timestamptz as fecha_baja,
        null::text as motivo_baja,
        pi.fecha_invitacion as fecha_creacion,
        pi.fecha_invitacion as fecha_modificacion,
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
        array_length(pi.playas_ids, 1)::bigint as total_playas
    FROM public.playero_invitacion pi
    JOIN public.playa p ON p.playa_id = ANY(pi.playas_ids)
    WHERE pi.estado = 'PENDIENTE' 
    AND pi.fecha_expiracion > now()
    GROUP BY pi.invitacion_id, pi.dueno_invitador_id, pi.email, pi.nombre, pi.fecha_invitacion, pi.playas_ids
)
SELECT 
    pr.playero_id,
    pr.dueno_invitador_id,
    pr.usuario_id,
    pr.email,
    pr.usuario_nombre,
    pr.usuario_telefono,
    pr.tipo_registro,
    pr.estado,
    pr.fecha_alta,
    pr.fecha_baja,
    pr.motivo_baja,
    pr.fecha_creacion,
    pr.fecha_modificacion,
    array_to_json(pr.playas_asignadas) as playas_asignadas,
    pr.total_playas
FROM playeros_registrados pr

UNION ALL

SELECT 
    ip.playero_id,
    ip.dueno_invitador_id,
    ip.usuario_id,
    ip.email,
    ip.usuario_nombre,
    ip.usuario_telefono,
    ip.tipo_registro,
    ip.estado,
    ip.fecha_alta,
    ip.fecha_baja,
    ip.motivo_baja,
    ip.fecha_creacion,
    ip.fecha_modificacion,
    array_to_json(ip.playas_asignadas) as playas_asignadas,
    ip.total_playas
FROM invitaciones_pendientes ip;

COMMENT ON VIEW v_playeros IS 'Vista unificada de playeros registrados e invitaciones pendientes con campos planos para facilitar ordenamiento y filtrado. Incluye información del usuario y playas asignadas.';

