-- =====================================================
-- MIGRACIÓN: CORREGIR TIPOS EN FUNCIÓN DE LIMPIEZA
-- =====================================================

CREATE OR REPLACE FUNCTION public.cleanup_orphaned_user(
    p_email text
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_usuario_id uuid;
    v_auth_exists boolean;
    v_deleted_relations integer := 0;
    v_deleted_roles integer := 0;
    v_deleted_user integer := 0;  -- Cambiar a integer
BEGIN
    -- Buscar usuario en public.usuario
    SELECT usuario_id INTO v_usuario_id
    FROM public.usuario
    WHERE email = p_email;
    
    IF v_usuario_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Usuario no encontrado en public.usuario'
        );
    END IF;
    
    -- Verificar si existe en auth.users
    SELECT EXISTS (
        SELECT 1 FROM auth.users WHERE id = v_usuario_id
    ) INTO v_auth_exists;
    
    IF v_auth_exists THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Usuario existe en auth.users, no es huérfano'
        );
    END IF;
    
    -- Limpiar relaciones playero_playa
    DELETE FROM public.playero_playa 
    WHERE playero_id = v_usuario_id;
    GET DIAGNOSTICS v_deleted_relations = ROW_COUNT;
    
    -- Limpiar roles
    DELETE FROM public.rol_usuario 
    WHERE usuario_id = v_usuario_id;
    GET DIAGNOSTICS v_deleted_roles = ROW_COUNT;
    
    -- Eliminar usuario
    DELETE FROM public.usuario 
    WHERE usuario_id = v_usuario_id;
    GET DIAGNOSTICS v_deleted_user = ROW_COUNT;
    
    RETURN json_build_object(
        'success', true,
        'message', format('Usuario huérfano %s limpiado exitosamente', p_email),
        'deleted_relations', v_deleted_relations,
        'deleted_roles', v_deleted_roles,
        'deleted_user', v_deleted_user > 0
    );
END;
$$;
