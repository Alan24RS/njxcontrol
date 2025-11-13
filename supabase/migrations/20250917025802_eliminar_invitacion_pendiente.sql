-- =====================================================
-- MIGRACIÓN: FUNCIÓN PARA ELIMINAR INVITACIONES PENDIENTES
-- =====================================================
-- Permite eliminar invitaciones pendientes desde el listado de playeros

-- Función RPC para eliminar invitación pendiente
CREATE OR REPLACE FUNCTION public.eliminar_invitacion_pendiente(
    p_email text,
    p_dueno_id uuid DEFAULT auth.uid()
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_invitacion record;
    v_result json;
BEGIN
    -- Verificar que existe una invitación pendiente del dueño actual
    SELECT * INTO v_invitacion
    FROM public.playero_invitacion 
    WHERE email = p_email 
    AND dueno_invitador_id = p_dueno_id
    AND estado = 'PENDIENTE'
    AND fecha_expiracion > now()
    LIMIT 1;
    
    IF v_invitacion IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Invitación no encontrada o ya expirada'
        );
    END IF;
    
    -- Marcar invitación como expirada (no eliminar físicamente para mantener historial)
    UPDATE public.playero_invitacion 
    SET estado = 'EXPIRADA',
        fecha_expiracion = now()
    WHERE invitacion_id = v_invitacion.invitacion_id;
    
    RETURN json_build_object(
        'success', true,
        'message', format('Invitación a %s eliminada correctamente', p_email)
    );
END;
$$;

-- Otorgar permisos de ejecución
GRANT EXECUTE ON FUNCTION public.eliminar_invitacion_pendiente(text, uuid) TO authenticated;
