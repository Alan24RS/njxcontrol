-- =====================================================
-- MIGRACIÓN: ARREGLAR LÓGICA DE REUTILIZACIÓN DE INVITACIONES
-- =====================================================
-- Permite reutilizar invitaciones si el usuario de auth fue eliminado
-- pero la invitación ya fue procesada

-- 1. Actualizar función de validación para permitir invitaciones ACEPTADAS sin usuario en auth
CREATE OR REPLACE FUNCTION public.validar_token_invitacion(
    p_token text
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_invitacion public.playero_invitacion;
    v_dueno_nombre text;
    v_playas_nombres text[];
    v_auth_user_exists boolean;
BEGIN
    -- Buscar invitación por token
    SELECT * INTO v_invitacion
    FROM public.playero_invitacion 
    WHERE invitacion_id::text = p_token
    AND fecha_expiracion > now();
    
    IF v_invitacion IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Token de invitación inválido o expirado'
        );
    END IF;
    
    -- Si la invitación está ACEPTADA, verificar si el usuario de auth existe
    IF v_invitacion.estado = 'ACEPTADA' AND v_invitacion.auth_user_id IS NOT NULL THEN
        SELECT EXISTS (
            SELECT 1 FROM auth.users WHERE id = v_invitacion.auth_user_id
        ) INTO v_auth_user_exists;
        
        -- Si el usuario de auth no existe, permitir reutilizar la invitación
        IF NOT v_auth_user_exists THEN
            -- Marcar como PENDIENTE nuevamente para permitir reutilización
            UPDATE public.playero_invitacion 
            SET estado = 'PENDIENTE',
                auth_user_id = NULL,
                fecha_aceptacion = NULL
            WHERE invitacion_id = v_invitacion.invitacion_id;
            
            -- Actualizar el estado local
            v_invitacion.estado := 'PENDIENTE';
            v_invitacion.auth_user_id := NULL;
        ELSE
            RETURN json_build_object(
                'success', false,
                'error', 'Esta invitación ya fue utilizada por otro usuario'
            );
        END IF;
    END IF;
    
    -- Solo permitir invitaciones PENDIENTES
    IF v_invitacion.estado != 'PENDIENTE' THEN
        RETURN json_build_object(
            'success', false,
            'error', format('Invitación en estado %s, debe estar PENDIENTE', v_invitacion.estado)
        );
    END IF;
    
    -- Obtener nombre del dueño
    SELECT nombre INTO v_dueno_nombre
    FROM public.usuario
    WHERE usuario_id = v_invitacion.dueno_invitador_id;
    
    -- Obtener nombres de las playas
    SELECT array_agg(nombre) INTO v_playas_nombres
    FROM public.playa
    WHERE playa_id = ANY(v_invitacion.playas_ids);
    
    RETURN json_build_object(
        'success', true,
        'data', json_build_object(
            'email', v_invitacion.email,
            'nombre', v_invitacion.nombre,
            'dueno_invitador_id', v_invitacion.dueno_invitador_id,
            'dueno_nombre', v_dueno_nombre,
            'playas_ids', v_invitacion.playas_ids,
            'playas_nombres', v_playas_nombres
        )
    );
END;
$$;

-- 2. Actualizar función de aceptar invitación para limpiar usuarios huérfanos
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
BEGIN
    -- Buscar invitación
    SELECT * INTO v_invitacion
    FROM public.playero_invitacion 
    WHERE invitacion_id::text = p_token
    AND estado = 'PENDIENTE'
    AND fecha_expiracion > now();
    
    IF v_invitacion IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Token inválido o expirado'
        );
    END IF;
    
    -- Verificar si hay un usuario huérfano con este email
    SELECT usuario_id INTO v_orphaned_user_id
    FROM public.usuario 
    WHERE email = v_invitacion.email
    AND NOT EXISTS (SELECT 1 FROM auth.users WHERE id = usuario_id);
    
    -- Limpiar usuario huérfano si existe
    IF v_orphaned_user_id IS NOT NULL THEN
        DELETE FROM public.playero_playa WHERE playero_id = v_orphaned_user_id;
        DELETE FROM public.rol_usuario WHERE usuario_id = v_orphaned_user_id;
        DELETE FROM public.usuario WHERE usuario_id = v_orphaned_user_id;
    END IF;
    
    -- Marcar invitación como aceptada
    UPDATE public.playero_invitacion 
    SET estado = 'ACEPTADA',
        fecha_aceptacion = now(),
        auth_user_id = p_auth_user_id
    WHERE invitacion_id = v_invitacion.invitacion_id;
    
    -- Crear usuario en public.usuario
    INSERT INTO public.usuario (usuario_id, email, nombre)
    VALUES (p_auth_user_id, v_invitacion.email, p_nombre_final)
    ON CONFLICT (usuario_id) DO UPDATE SET
        nombre = excluded.nombre,
        fecha_modificacion = now();
    
    -- Asignar rol PLAYERO
    INSERT INTO public.rol_usuario (usuario_id, rol)
    VALUES (p_auth_user_id, 'PLAYERO')
    ON CONFLICT (usuario_id, rol) DO NOTHING;
    
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
        'orphaned_cleaned', v_orphaned_user_id IS NOT NULL
    );
END;
$$;

-- 3. Comentarios actualizados
COMMENT ON FUNCTION public.validar_token_invitacion IS 
'Valida un token de invitación, permite reutilizar invitaciones ACEPTADAS si el usuario de auth fue eliminado';

COMMENT ON FUNCTION public.aceptar_invitacion_playero_por_token IS 
'Acepta una invitación, limpia usuarios huérfanos automáticamente y crea las relaciones playero_playa';
