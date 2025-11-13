-- =====================================================
-- MIGRACIÓN: FUNCIÓN RPC PARA OBTENER PLAYEROS
-- =====================================================
-- Crea función RPC que obtiene playeros sin depender de RLS

-- Función para obtener playeros de un dueño específico
CREATE OR REPLACE FUNCTION public.get_playeros_for_dueno(
    p_dueno_id uuid DEFAULT auth.uid(),
    p_search_query text DEFAULT null,
    p_limit integer DEFAULT 50,
    p_offset integer DEFAULT 0
) RETURNS TABLE (
    playero_id uuid,
    dueno_invitador_id uuid,
    usuario_id uuid,
    email text,
    nombre text,
    telefono text,
    tipo_registro text,
    estado text,
    fecha_alta timestamptz,
    fecha_baja timestamptz,
    motivo_baja text,
    fecha_creacion timestamptz,
    fecha_modificacion timestamptz,
    playas_asignadas json,
    total_playas bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH playeros_registrados AS (
        SELECT 
            pp.playero_id,
            pp.dueno_invitador_id,
            u.usuario_id,
            u.email,
            u.nombre,
            u.telefono,
            'REGISTRADO'::text as tipo_registro,
            public.obtener_estado_consolidado_playero(pp.playero_id, pp.dueno_invitador_id) as estado,
            MIN(pp.fecha_alta) as fecha_alta_principal,
            MAX(pp.fecha_baja) as fecha_baja_principal,
            string_agg(DISTINCT pp.motivo_baja, '; ') as motivo_baja_principal,
            MIN(pp.fecha_creacion) as fecha_creacion_principal,
            MAX(pp.fecha_modificacion) as fecha_modificacion_principal,
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
        WHERE p.playa_dueno_id = p_dueno_id
        GROUP BY pp.playero_id, pp.dueno_invitador_id, u.usuario_id, u.email, u.nombre, u.telefono
    ),
    invitaciones_pendientes AS (
        SELECT 
            null::uuid as playero_id,
            pi.dueno_invitador_id,
            null::uuid as usuario_id,
            pi.email,
            pi.nombre,
            null::text as telefono,
            'INVITACION_PENDIENTE'::text as tipo_registro,
            'PENDIENTE'::text as estado,
            null::timestamptz as fecha_alta_principal,
            null::timestamptz as fecha_baja_principal,
            null::text as motivo_baja_principal,
            pi.fecha_invitacion as fecha_creacion_principal,
            pi.fecha_invitacion as fecha_modificacion_principal,
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
        AND pi.dueno_invitador_id = p_dueno_id
        GROUP BY pi.invitacion_id, pi.dueno_invitador_id, pi.email, pi.nombre, pi.fecha_invitacion, pi.playas_ids
    ),
    combined_results AS (
        SELECT 
            pr.playero_id,
            pr.dueno_invitador_id,
            pr.usuario_id,
            pr.email,
            pr.nombre,
            pr.telefono,
            pr.tipo_registro,
            pr.estado,
            pr.fecha_alta_principal as fecha_alta,
            pr.fecha_baja_principal as fecha_baja,
            pr.motivo_baja_principal as motivo_baja,
            pr.fecha_creacion_principal as fecha_creacion,
            pr.fecha_modificacion_principal as fecha_modificacion,
            array_to_json(pr.playas_asignadas) as playas_asignadas,
            pr.total_playas
        FROM playeros_registrados pr
        
        UNION ALL
        
        SELECT 
            ip.playero_id,
            ip.dueno_invitador_id,
            ip.usuario_id,
            ip.email,
            ip.nombre,
            ip.telefono,
            ip.tipo_registro,
            ip.estado,
            ip.fecha_alta_principal as fecha_alta,
            ip.fecha_baja_principal as fecha_baja,
            ip.motivo_baja_principal as motivo_baja,
            ip.fecha_creacion_principal as fecha_creacion,
            ip.fecha_modificacion_principal as fecha_modificacion,
            array_to_json(ip.playas_asignadas) as playas_asignadas,
            ip.total_playas
        FROM invitaciones_pendientes ip
    )
    SELECT 
        cr.playero_id,
        cr.dueno_invitador_id,
        cr.usuario_id,
        cr.email,
        cr.nombre,
        cr.telefono,
        cr.tipo_registro,
        cr.estado,
        cr.fecha_alta,
        cr.fecha_baja,
        cr.motivo_baja,
        cr.fecha_creacion,
        cr.fecha_modificacion,
        cr.playas_asignadas,
        cr.total_playas
    FROM combined_results cr
    WHERE (
        p_search_query IS NULL 
        OR cr.nombre ILIKE '%' || p_search_query || '%'
        OR cr.email ILIKE '%' || p_search_query || '%'
    )
    ORDER BY cr.fecha_alta DESC NULLS LAST
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- Comentario
COMMENT ON FUNCTION public.get_playeros_for_dueno(uuid, text, integer, integer) IS 'Obtiene la lista de playeros para un dueño específico sin depender de RLS, incluyendo invitaciones pendientes';
