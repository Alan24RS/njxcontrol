-- 1. Modificar la tabla para permitir fecha_alta nullable cuando el estado es PENDIENTE
ALTER TABLE public.playero_playa ALTER COLUMN fecha_alta DROP NOT NULL;

-- 2. Función temporal para corregir el playero existente que debería estar pendiente
CREATE OR REPLACE FUNCTION public.fix_existing_playero_to_pending(
    p_playero_email text,
    p_dueno_id uuid DEFAULT auth.uid()
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_playero_id uuid;
    v_affected_rows integer;
BEGIN
    -- Buscar el ID del playero por email
    SELECT usuario_id INTO v_playero_id
    FROM public.usuario 
    WHERE email = p_playero_email;
    
    IF v_playero_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Usuario no encontrado'
        );
    END IF;
    
    -- Cambiar estado a PENDIENTE
    UPDATE public.playero_playa 
    SET estado = 'PENDIENTE', 
        fecha_alta = null,
        fecha_modificacion = now()
    WHERE playero_id = v_playero_id
    AND dueno_invitador_id = p_dueno_id;
    
    GET DIAGNOSTICS v_affected_rows = ROW_COUNT;
    
    RETURN json_build_object(
        'success', true,
        'updated_rows', v_affected_rows,
        'message', format('Se actualizaron %s relaciones a estado PENDIENTE para %s', v_affected_rows, p_playero_email)
    );
END;
$$;

-- 3. Corregir el playero existente que debería estar pendiente
SELECT public.fix_existing_playero_to_pending('reactiontimeshop@gmail.com', '3b397e4a-d4eb-462a-a1be-c63f0dd36ab6');
