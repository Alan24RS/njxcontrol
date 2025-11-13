-- 1. Mejorar validar_token_invitacion para indicar si usuario ya existe
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
    v_usuario_existente uuid;
    v_usuario_tiene_cuenta boolean := false;
BEGIN
    SELECT * INTO v_invitacion
    FROM public.playero_invitacion 
    WHERE invitacion_id::text = p_token
    AND estado = 'PENDIENTE'
    AND fecha_expiracion > now();
    
    IF v_invitacion IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Token de invitación inválido o expirado'
        );
    END IF;
    
    SELECT nombre INTO v_dueno_nombre
    FROM public.usuario
    WHERE usuario_id = v_invitacion.dueno_invitador_id;
    
    SELECT array_agg(nombre) INTO v_playas_nombres
    FROM public.playa
    WHERE playa_id = ANY(v_invitacion.playas_ids);
    
    SELECT id INTO v_usuario_existente
    FROM auth.users
    WHERE email = v_invitacion.email;
    
    IF v_usuario_existente IS NOT NULL THEN
        v_usuario_tiene_cuenta := true;
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'data', json_build_object(
            'email', v_invitacion.email,
            'nombre', v_invitacion.nombre,
            'dueno_invitador_id', v_invitacion.dueno_invitador_id,
            'dueno_nombre', v_dueno_nombre,
            'playas_ids', v_invitacion.playas_ids,
            'playas_nombres', v_playas_nombres,
            'usuario_existe', v_usuario_tiene_cuenta,
            'usuario_id', v_usuario_existente
        )
    );
END;
$$;

-- 2. Crear función para aceptar invitación de usuario existente
CREATE OR REPLACE FUNCTION public.aceptar_invitacion_usuario_existente(
    p_token text,
    p_auth_user_id uuid
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_invitacion public.playero_invitacion;
    v_playas_count integer;
    v_tiene_rol_playero boolean;
BEGIN
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
    
    SELECT EXISTS(
        SELECT 1 FROM public.rol_usuario 
        WHERE usuario_id = p_auth_user_id AND rol = 'PLAYERO'
    ) INTO v_tiene_rol_playero;
    
    IF NOT v_tiene_rol_playero THEN
        INSERT INTO public.rol_usuario (usuario_id, rol)
        VALUES (p_auth_user_id, 'PLAYERO')
        ON CONFLICT (usuario_id, rol) DO NOTHING;
    END IF;
    
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
        dueno_invitador_id = EXCLUDED.dueno_invitador_id,
        fecha_modificacion = now();
    
    GET DIAGNOSTICS v_playas_count = ROW_COUNT;
    
    RETURN json_build_object(
        'success', true,
        'message', format('Ahora puedes trabajar en %s playas', v_playas_count),
        'playas_asignadas', v_playas_count
    );
END;
$$;

-- 3. Mejorar eliminar_playero para eliminar de auth.users si no tiene más relaciones
CREATE OR REPLACE FUNCTION public.eliminar_playero(
    p_playero_id uuid,
    p_playa_id uuid,
    p_motivo text DEFAULT 'Eliminado por el dueño'
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_dueno_id uuid;
    v_playero_email text;
    v_playero_nombre text;
    v_es_referenciado boolean := false;
    v_playas_del_dueno uuid[];
    v_total_relaciones_usuario integer := 0;
    v_invitaciones_eliminadas integer := 0;
    v_usuario_eliminado boolean := false;
    v_result json;
BEGIN
    SELECT playa_dueno_id INTO v_dueno_id
    FROM public.playa 
    WHERE playa_id = p_playa_id;
    
    IF v_dueno_id != auth.uid() THEN
        RETURN json_build_object(
            'success', false,
            'error', 'No tienes permisos para eliminar playeros de esta playa'
        );
    END IF;
    
    SELECT u.email, u.nombre INTO v_playero_email, v_playero_nombre
    FROM public.usuario u
    WHERE u.usuario_id = p_playero_id;
    
    SELECT array_agg(pp.playa_id) INTO v_playas_del_dueno
    FROM public.playero_playa pp
    JOIN public.playa p ON pp.playa_id = p.playa_id
    WHERE pp.playero_id = p_playero_id 
    AND p.playa_dueno_id = v_dueno_id
    AND pp.estado IN ('ACTIVO', 'SUSPENDIDO');
    
    IF v_playas_del_dueno IS NULL OR array_length(v_playas_del_dueno, 1) = 0 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'El playero no está asignado a ninguna playa de este dueño'
        );
    END IF;
    
    DELETE FROM public.playero_invitacion 
    WHERE email = v_playero_email 
    AND dueno_invitador_id = v_dueno_id;
    
    GET DIAGNOSTICS v_invitaciones_eliminadas = ROW_COUNT;
    
    IF v_es_referenciado THEN
        UPDATE public.playero_playa 
        SET estado = 'SUSPENDIDO',
            fecha_baja = now(),
            motivo_baja = p_motivo,
            fecha_modificacion = now()
        WHERE playero_id = p_playero_id 
        AND playa_id = ANY(v_playas_del_dueno);
        
        v_result := json_build_object(
            'success', true,
            'action', 'suspended',
            'role_removed', false,
            'affected_playas', array_length(v_playas_del_dueno, 1),
            'invitations_deleted', v_invitaciones_eliminadas,
            'message', format('Playero %s suspendido de %s playas (tiene referencias en el sistema)', 
                v_playero_nombre, array_length(v_playas_del_dueno, 1))
        );
    ELSE
        DELETE FROM public.playero_playa 
        WHERE playero_id = p_playero_id 
        AND playa_id = ANY(v_playas_del_dueno);
        
        SELECT COUNT(*) INTO v_total_relaciones_usuario
        FROM public.playero_playa pp
        WHERE pp.playero_id = p_playero_id 
        AND pp.estado IN ('ACTIVO', 'SUSPENDIDO');
        
        IF v_total_relaciones_usuario = 0 THEN
            DELETE FROM public.rol_usuario 
            WHERE usuario_id = p_playero_id AND rol = 'PLAYERO';
            
            DELETE FROM public.usuario
            WHERE usuario_id = p_playero_id;
            
            DELETE FROM auth.users
            WHERE id = p_playero_id;
            
            v_usuario_eliminado := true;
            
            v_result := json_build_object(
                'success', true,
                'action', 'deleted',
                'role_removed', true,
                'user_deleted', true,
                'affected_playas', array_length(v_playas_del_dueno, 1),
                'invitations_deleted', v_invitaciones_eliminadas,
                'message', format('Playero %s eliminado completamente del sistema', v_playero_nombre)
            );
        ELSE
            v_result := json_build_object(
                'success', true,
                'action', 'deleted',
                'role_removed', false,
                'user_deleted', false,
                'affected_playas', array_length(v_playas_del_dueno, 1),
                'invitations_deleted', v_invitaciones_eliminadas,
                'message', format('Playero %s eliminado de %s playas (mantiene rol PLAYERO por %s asignaciones con otros dueños)', 
                    v_playero_nombre, array_length(v_playas_del_dueno, 1), v_total_relaciones_usuario)
            );
        END IF;
    END IF;
    
    RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.validar_token_invitacion IS 'Valida token e indica si el usuario ya tiene cuenta registrada';
COMMENT ON FUNCTION public.aceptar_invitacion_usuario_existente IS 'Acepta invitación para usuarios que ya tienen cuenta en el sistema';
COMMENT ON FUNCTION public.eliminar_playero IS 'Elimina playero y si no tiene más relaciones, elimina completamente de auth.users y usuario';

