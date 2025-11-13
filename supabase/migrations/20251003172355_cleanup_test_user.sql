CREATE OR REPLACE FUNCTION public.cleanup_test_user(
    p_email text
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_usuario_id uuid;
    v_deleted_roles integer := 0;
    v_deleted_playero_playa integer := 0;
    v_deleted_invitations integer := 0;
    v_deleted_usuario integer := 0;
BEGIN
    SELECT usuario_id INTO v_usuario_id
    FROM public.usuario
    WHERE email = p_email;
    
    IF v_usuario_id IS NOT NULL THEN
        DELETE FROM public.playero_playa WHERE playero_id = v_usuario_id;
        GET DIAGNOSTICS v_deleted_playero_playa = ROW_COUNT;
        
        DELETE FROM public.rol_usuario WHERE usuario_id = v_usuario_id;
        GET DIAGNOSTICS v_deleted_roles = ROW_COUNT;
        
        DELETE FROM public.usuario WHERE usuario_id = v_usuario_id;
        GET DIAGNOSTICS v_deleted_usuario = ROW_COUNT;
    END IF;
    
    DELETE FROM public.playero_invitacion WHERE email = p_email;
    GET DIAGNOSTICS v_deleted_invitations = ROW_COUNT;
    
    RETURN json_build_object(
        'success', true,
        'email', p_email,
        'usuario_id', v_usuario_id,
        'deleted', json_build_object(
            'playero_playa', v_deleted_playero_playa,
            'roles', v_deleted_roles,
            'usuario', v_deleted_usuario,
            'invitations', v_deleted_invitations
        ),
        'message', format('Limpiado usuario de prueba: %s', p_email)
    );
END;
$$;

COMMENT ON FUNCTION public.cleanup_test_user(text) IS 'Función temporal para limpiar usuarios de prueba. ELIMINAR EN PRODUCCIÓN.';

