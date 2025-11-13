-- =====================================================
-- MIGRACIÓN: LIMPIAR INVITACIONES DUPLICADAS
-- =====================================================
-- Función para limpiar invitaciones duplicadas de un email específico

CREATE OR REPLACE FUNCTION public.cleanup_duplicate_invitations(
    p_email text
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_accepted_count integer;
    v_pending_count integer;
    v_deleted_count integer;
BEGIN
    -- Contar invitaciones existentes
    SELECT COUNT(*) INTO v_accepted_count
    FROM public.playero_invitacion 
    WHERE email = p_email AND estado = 'ACEPTADA';
    
    SELECT COUNT(*) INTO v_pending_count
    FROM public.playero_invitacion 
    WHERE email = p_email AND estado = 'PENDIENTE';
    
    -- Si hay invitaciones aceptadas, eliminar todas las pendientes
    IF v_accepted_count > 0 THEN
        DELETE FROM public.playero_invitacion 
        WHERE email = p_email AND estado = 'PENDIENTE';
        
        GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
        
        RETURN json_build_object(
            'success', true,
            'message', format('Eliminadas %s invitaciones pendientes duplicadas para %s', v_deleted_count, p_email),
            'accepted_invitations', v_accepted_count,
            'deleted_pending', v_deleted_count
        );
    END IF;
    
    -- Si hay múltiples invitaciones pendientes, mantener solo la más reciente
    IF v_pending_count > 1 THEN
        DELETE FROM public.playero_invitacion 
        WHERE email = p_email 
        AND estado = 'PENDIENTE'
        AND invitacion_id NOT IN (
            SELECT invitacion_id 
            FROM public.playero_invitacion 
            WHERE email = p_email AND estado = 'PENDIENTE'
            ORDER BY fecha_invitacion DESC 
            LIMIT 1
        );
        
        GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
        
        RETURN json_build_object(
            'success', true,
            'message', format('Eliminadas %s invitaciones pendientes duplicadas para %s', v_deleted_count, p_email),
            'pending_invitations_remaining', 1,
            'deleted_duplicates', v_deleted_count
        );
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'message', format('No hay invitaciones duplicadas para %s', p_email),
        'accepted_invitations', v_accepted_count,
        'pending_invitations', v_pending_count
    );
END;
$$;

-- Comentario para la función
COMMENT ON FUNCTION public.cleanup_duplicate_invitations(text) IS 'Limpia invitaciones duplicadas para un email específico. Si hay invitaciones aceptadas, elimina las pendientes. Si hay múltiples pendientes, mantiene solo la más reciente.';
