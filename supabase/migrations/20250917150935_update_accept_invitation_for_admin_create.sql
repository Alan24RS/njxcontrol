-- =====================================================
-- MIGRACIÓN: ACTUALIZAR FUNCIÓN ACEPTAR INVITACIÓN PARA ADMIN CREATE
-- =====================================================
-- Actualiza la función para manejar usuarios creados con admin.createUser
-- que no pasan por el trigger automáticamente

CREATE OR REPLACE FUNCTION public.aceptar_invitacion_playero_por_token(
    p_token text,
    p_auth_user_id uuid,
    p_nombre_final text
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_invitacion public.playero_invitacion;
    v_playas_count integer;
    v_user_exists boolean;
BEGIN
    -- Buscar y marcar invitación como aceptada
    UPDATE public.playero_invitacion 
    SET estado = 'ACEPTADA',
        fecha_aceptacion = now(),
        auth_user_id = p_auth_user_id
    WHERE invitacion_id::text = p_token
    AND estado = 'PENDIENTE'
    AND fecha_expiracion > now()
    RETURNING * INTO v_invitacion;
    
    IF v_invitacion IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Token inválido o expirado'
        );
    END IF;
    
    -- Verificar si el usuario ya existe en public.usuario
    SELECT EXISTS (
        SELECT 1 FROM public.usuario WHERE usuario_id = p_auth_user_id
    ) INTO v_user_exists;
    
    -- Crear usuario en public.usuario si no existe (para usuarios creados con admin.createUser)
    IF NOT v_user_exists THEN
        INSERT INTO public.usuario (usuario_id, email, nombre)
        VALUES (p_auth_user_id, v_invitacion.email, p_nombre_final)
        ON CONFLICT (usuario_id) DO UPDATE SET
            nombre = excluded.nombre,
            fecha_modificacion = now();
        
        -- Asignar rol PLAYERO
        INSERT INTO public.rol_usuario (usuario_id, rol)
        VALUES (p_auth_user_id, 'PLAYERO')
        ON CONFLICT (usuario_id, rol) DO NOTHING;
    END IF;
    
    -- Crear relaciones playero_playa para cada playa asignada
    INSERT INTO public.playero_playa (
        playero_id, 
        playa_id, 
        dueno_invitador_id,
        estado
    )
    SELECT 
        p_auth_user_id,
        unnest(v_invitacion.playas_ids),
        v_invitacion.dueno_invitador_id,
        'ACTIVO'::playero_playa_estado
    ON CONFLICT (playero_id, playa_id) DO UPDATE SET
        estado = 'ACTIVO',
        fecha_modificacion = now();
    
    -- Contar playas asignadas
    GET DIAGNOSTICS v_playas_count = ROW_COUNT;
    
    RETURN json_build_object(
        'success', true,
        'message', format('Invitación aceptada. Usuario creado y asignado a %s playas', v_playas_count),
        'playas_asignadas', v_playas_count,
        'user_created', NOT v_user_exists
    );
END;
$$;

-- Comentario actualizado
COMMENT ON FUNCTION public.aceptar_invitacion_playero_por_token IS 
'Acepta una invitación usando el token, crea el usuario en public.usuario si no existe (para admin.createUser), y crea las relaciones playero_playa';
