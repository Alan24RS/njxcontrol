CREATE OR REPLACE FUNCTION public.cleanup_auth_user(
    p_email text
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id uuid;
    v_deleted boolean := false;
BEGIN
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = p_email;
    
    IF v_user_id IS NOT NULL THEN
        DELETE FROM auth.users WHERE id = v_user_id;
        v_deleted := true;
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'email', p_email,
        'user_id', v_user_id,
        'deleted_from_auth', v_deleted,
        'message', format('Usuario eliminado de auth.users: %s', p_email)
    );
END;
$$;

COMMENT ON FUNCTION public.cleanup_auth_user(text) IS 'Función temporal para eliminar usuarios de auth.users. ELIMINAR EN PRODUCCIÓN.';

