-- =====================================================
-- MIGRACIÓN: CORREGIR REENVÍO DE INVITACIÓN ELIMINANDO ANTERIORES
-- =====================================================
-- Modifica la función reenviar_invitacion_playero para eliminar invitaciones anteriores
-- en lugar de marcarlas como expiradas para evitar conflictos de restricción única

CREATE OR REPLACE FUNCTION public.reenviar_invitacion_playero(
    p_email text,
    p_dueno_id uuid DEFAULT auth.uid()
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_invitacion_id uuid;
    v_nombre text;
    v_playas_ids uuid[];
    v_accepted_count integer;
    v_result json;
BEGIN
    -- Verificar si ya hay invitaciones aceptadas para este email
    SELECT COUNT(*) INTO v_accepted_count
    FROM public.playero_invitacion 
    WHERE email = p_email 
    AND dueno_invitador_id = p_dueno_id
    AND estado = 'ACEPTADA';
    
    IF v_accepted_count > 0 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'El playero ya ha aceptado su invitación y está activo en el sistema'
        );
    END IF;
    
    -- Verificar que el playero no haya activado su cuenta (verificación adicional)
    IF EXISTS (
        SELECT 1 FROM public.playero_playa pp
        JOIN public.usuario u ON pp.playero_id = u.usuario_id
        WHERE u.email = p_email 
        AND pp.dueno_invitador_id = p_dueno_id
        AND pp.estado IN ('ACTIVO', 'SUSPENDIDO')
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'El playero ya ha activado su cuenta'
        );
    END IF;
    
    -- Buscar invitación pendiente para obtener los datos
    SELECT invitacion_id, nombre, playas_ids 
    INTO v_invitacion_id, v_nombre, v_playas_ids
    FROM public.playero_invitacion 
    WHERE email = p_email 
    AND dueno_invitador_id = p_dueno_id
    AND estado = 'PENDIENTE'
    ORDER BY fecha_invitacion DESC
    LIMIT 1;
    
    IF v_invitacion_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'No se encontró una invitación pendiente para este email'
        );
    END IF;
    
    -- ELIMINAR COMPLETAMENTE todas las invitaciones anteriores para este email y dueño
    -- Esto evita conflictos con la restricción única
    DELETE FROM public.playero_invitacion 
    WHERE email = p_email 
    AND dueno_invitador_id = p_dueno_id;
    
    -- Crear una nueva invitación con datos frescos
    INSERT INTO public.playero_invitacion (
        email,
        nombre,
        playas_ids,
        dueno_invitador_id,
        estado,
        fecha_invitacion,
        fecha_expiracion,
        fecha_modificacion
    ) VALUES (
        p_email,
        v_nombre,
        v_playas_ids,
        p_dueno_id,
        'PENDIENTE',
        now(),
        now() + interval '7 days',
        now()
    ) RETURNING invitacion_id INTO v_invitacion_id;
    
    -- Retornar información para que el frontend pueda reenviar el email
    -- SIEMPRE indicar que requiere email para forzar el reenvío
    RETURN json_build_object(
        'success', true,
        'invitacion_id', v_invitacion_id,
        'email', p_email,
        'nombre', v_nombre,
        'playas_ids', v_playas_ids,
        'requires_email', true,
        'message', format('Nueva invitación creada y enviada a %s', p_email)
    );
END;
$$;

-- Comentario para la función
COMMENT ON FUNCTION public.reenviar_invitacion_playero(text, uuid) IS 'Reenvía una invitación eliminando completamente las anteriores y creando una nueva. Siempre requiere reenvío de email.';
