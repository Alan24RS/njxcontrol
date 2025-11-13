-- =====================================================
-- MIGRACIÓN: HACER FUNCIÓN ACEPTAR INVITACIÓN IDEMPOTENTE
-- =====================================================
-- Mejora la función para que se pueda ejecutar múltiples veces sin problemas
-- evitando errores de doble ejecución que causan rollbacks

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
    v_orphaned_user_id uuid;
    v_already_processed boolean := false;
BEGIN
    -- Buscar invitación (PENDIENTE o ya ACEPTADA por el mismo usuario)
    SELECT * INTO v_invitacion
    FROM public.playero_invitacion 
    WHERE invitacion_id::text = p_token
    AND fecha_expiracion > now()
    AND (
        estado = 'PENDIENTE' 
        OR (estado = 'ACEPTADA' AND auth_user_id = p_auth_user_id)
    );
    
    IF v_invitacion IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Token inválido, expirado o ya utilizado por otro usuario'
        );
    END IF;
    
    -- Si ya está ACEPTADA por el mismo usuario, verificar si todo está en orden
    IF v_invitacion.estado = 'ACEPTADA' AND v_invitacion.auth_user_id = p_auth_user_id THEN
        -- Verificar si el usuario existe en public.usuario y tiene las relaciones correctas
        IF EXISTS (
            SELECT 1 FROM public.usuario WHERE usuario_id = p_auth_user_id
        ) AND EXISTS (
            SELECT 1 FROM public.playero_playa pp
            WHERE pp.playero_id = p_auth_user_id
            AND pp.playa_id = ANY(v_invitacion.playas_ids)
            AND pp.estado = 'ACTIVO'
        ) THEN
            -- Todo está en orden, devolver éxito
            SELECT array_length(v_invitacion.playas_ids, 1) INTO v_playas_count;
            
            RETURN json_build_object(
                'success', true,
                'message', format('Invitación ya procesada correctamente. Usuario asignado a %s playas', v_playas_count),
                'playas_asignadas', v_playas_count,
                'already_processed', true
            );
        ELSE
            -- Está marcada como ACEPTADA pero faltan datos, continuar con el procesamiento
            v_already_processed := true;
        END IF;
    END IF;
    
    -- Verificar si hay un usuario huérfano con este email
    SELECT usuario_id INTO v_orphaned_user_id
    FROM public.usuario 
    WHERE email = v_invitacion.email
    AND usuario_id != p_auth_user_id
    AND NOT EXISTS (SELECT 1 FROM auth.users WHERE id = usuario_id);
    
    -- Limpiar usuario huérfano si existe
    IF v_orphaned_user_id IS NOT NULL THEN
        DELETE FROM public.playero_playa WHERE playero_id = v_orphaned_user_id;
        DELETE FROM public.rol_usuario WHERE usuario_id = v_orphaned_user_id;
        DELETE FROM public.usuario WHERE usuario_id = v_orphaned_user_id;
    END IF;
    
    -- Marcar invitación como aceptada (solo si no estaba ya ACEPTADA)
    IF NOT v_already_processed THEN
        UPDATE public.playero_invitacion 
        SET estado = 'ACEPTADA',
            fecha_aceptacion = now(),
            auth_user_id = p_auth_user_id
        WHERE invitacion_id = v_invitacion.invitacion_id;
    END IF;
    
    -- Crear usuario en public.usuario (idempotente)
    INSERT INTO public.usuario (usuario_id, email, nombre)
    VALUES (p_auth_user_id, v_invitacion.email, p_nombre_final)
    ON CONFLICT (usuario_id) DO UPDATE SET
        nombre = excluded.nombre,
        fecha_modificacion = now();
    
    -- Asignar rol PLAYERO (idempotente)
    INSERT INTO public.rol_usuario (usuario_id, rol)
    VALUES (p_auth_user_id, 'PLAYERO')
    ON CONFLICT (usuario_id, rol) DO NOTHING;
    
    -- Crear relaciones playero_playa para cada playa asignada (idempotente)
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
    
    -- Si no se insertó nada, contar las existentes
    IF v_playas_count = 0 THEN
        SELECT COUNT(*) INTO v_playas_count
        FROM public.playero_playa pp
        WHERE pp.playero_id = p_auth_user_id
        AND pp.playa_id = ANY(v_invitacion.playas_ids)
        AND pp.estado = 'ACTIVO';
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'message', format('Invitación procesada exitosamente. Usuario asignado a %s playas', v_playas_count),
        'playas_asignadas', v_playas_count,
        'already_processed', v_already_processed,
        'orphaned_cleaned', v_orphaned_user_id IS NOT NULL
    );
END;
$$;

-- Comentario actualizado
COMMENT ON FUNCTION public.aceptar_invitacion_playero_por_token IS 
'Acepta una invitación de forma idempotente. Se puede ejecutar múltiples veces sin problemas. Limpia usuarios huérfanos automáticamente y crea las relaciones playero_playa';
