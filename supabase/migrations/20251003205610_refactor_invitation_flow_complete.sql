-- 1. Función para validar si un email existe en el sistema
CREATE OR REPLACE FUNCTION public.verificar_email_existe(
    p_email text
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_usuario_id uuid;
    v_nombre text;
BEGIN
    SELECT id, raw_user_meta_data->>'name' 
    INTO v_usuario_id, v_nombre
    FROM auth.users
    WHERE email = p_email;
    
    IF v_usuario_id IS NOT NULL THEN
        RETURN json_build_object(
            'existe', true,
            'usuario_id', v_usuario_id,
            'nombre', v_nombre
        );
    ELSE
        RETURN json_build_object(
            'existe', false,
            'usuario_id', null,
            'nombre', null
        );
    END IF;
END;
$$;

-- 2. Función para rechazar invitación
CREATE OR REPLACE FUNCTION public.rechazar_invitacion_playero(
    p_token text
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_invitacion public.playero_invitacion;
BEGIN
    UPDATE public.playero_invitacion 
    SET estado = 'RECHAZADA',
        fecha_modificacion = now()
    WHERE invitacion_id::text = p_token
    AND estado = 'PENDIENTE'
    AND fecha_expiracion > now()
    RETURNING * INTO v_invitacion;
    
    IF v_invitacion IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Invitación no encontrada o expirada'
        );
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Invitación rechazada correctamente'
    );
END;
$$;

-- 3. Agregar estado RECHAZADA al enum si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'RECHAZADA' 
        AND enumtypid = (
            SELECT oid FROM pg_type WHERE typname = 'playero_playa_estado'
        )
    ) THEN
        ALTER TYPE playero_playa_estado ADD VALUE 'RECHAZADA';
    END IF;
END $$;

-- 4. Modificar tabla playero_invitacion para soportar RECHAZADA
ALTER TABLE public.playero_invitacion 
DROP CONSTRAINT IF EXISTS playero_invitacion_estado_check;

ALTER TABLE public.playero_invitacion 
ADD CONSTRAINT playero_invitacion_estado_check 
CHECK (estado IN ('PENDIENTE', 'ACEPTADA', 'EXPIRADA', 'RECHAZADA'));

-- 5. Función mejorada para aceptar invitación sin requerir autenticación previa
CREATE OR REPLACE FUNCTION public.aceptar_invitacion_sin_auth(
    p_token text,
    p_email text
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_invitacion public.playero_invitacion;
    v_usuario_id uuid;
    v_playas_count integer;
    v_tiene_rol_playero boolean;
BEGIN
    SELECT * INTO v_invitacion
    FROM public.playero_invitacion 
    WHERE invitacion_id::text = p_token
    AND email = p_email
    AND estado = 'PENDIENTE'
    AND fecha_expiracion > now();
    
    IF v_invitacion IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Invitación no encontrada, expirada o el email no coincide'
        );
    END IF;
    
    SELECT id INTO v_usuario_id
    FROM auth.users
    WHERE email = p_email;
    
    IF v_usuario_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'El usuario debe completar su registro primero'
        );
    END IF;
    
    UPDATE public.playero_invitacion 
    SET estado = 'ACEPTADA',
        fecha_aceptacion = now(),
        auth_user_id = v_usuario_id
    WHERE invitacion_id = v_invitacion.invitacion_id;
    
    SELECT EXISTS(
        SELECT 1 FROM public.rol_usuario 
        WHERE usuario_id = v_usuario_id AND rol = 'PLAYERO'
    ) INTO v_tiene_rol_playero;
    
    IF NOT v_tiene_rol_playero THEN
        INSERT INTO public.rol_usuario (usuario_id, rol)
        VALUES (v_usuario_id, 'PLAYERO')
        ON CONFLICT (usuario_id, rol) DO NOTHING;
    END IF;
    
    INSERT INTO public.playero_playa (
        playero_id, 
        playa_id, 
        dueno_invitador_id,
        estado
    )
    SELECT 
        v_usuario_id,
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

-- 6. Función para desvincular playero de playas específicas
CREATE OR REPLACE FUNCTION public.desvincular_playero_de_playas(
    p_playero_id uuid,
    p_playas_ids uuid[],
    p_motivo text DEFAULT 'Desvinculado por el dueño'
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_dueno_id uuid := auth.uid();
    v_playas_validas uuid[];
    v_total_desvinculadas integer := 0;
    v_total_relaciones_restantes integer := 0;
    v_rol_eliminado boolean := false;
BEGIN
    SELECT array_agg(p.playa_id) INTO v_playas_validas
    FROM public.playa p
    WHERE p.playa_id = ANY(p_playas_ids)
    AND p.playa_dueno_id = v_dueno_id;
    
    IF v_playas_validas IS NULL OR array_length(v_playas_validas, 1) = 0 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'No tienes permisos sobre estas playas'
        );
    END IF;
    
    DELETE FROM public.playero_playa 
    WHERE playero_id = p_playero_id 
    AND playa_id = ANY(v_playas_validas)
    AND dueno_invitador_id = v_dueno_id;
    
    GET DIAGNOSTICS v_total_desvinculadas = ROW_COUNT;
    
    SELECT COUNT(*) INTO v_total_relaciones_restantes
    FROM public.playero_playa pp
    WHERE pp.playero_id = p_playero_id 
    AND pp.estado IN ('ACTIVO', 'SUSPENDIDO');
    
    IF v_total_relaciones_restantes = 0 THEN
        DELETE FROM public.rol_usuario 
        WHERE usuario_id = p_playero_id AND rol = 'PLAYERO';
        v_rol_eliminado := true;
    END IF;
    
    DELETE FROM public.playero_invitacion 
    WHERE dueno_invitador_id = v_dueno_id
    AND auth_user_id = p_playero_id
    AND estado IN ('PENDIENTE', 'EXPIRADA');
    
    RETURN json_build_object(
        'success', true,
        'playas_desvinculadas', v_total_desvinculadas,
        'relaciones_restantes', v_total_relaciones_restantes,
        'rol_eliminado', v_rol_eliminado,
        'message', format('Playero desvinculado de %s playa(s)', v_total_desvinculadas)
    );
END;
$$;

-- 7. Comentarios
COMMENT ON FUNCTION public.verificar_email_existe IS 'Verifica si un email ya está registrado en el sistema';
COMMENT ON FUNCTION public.rechazar_invitacion_playero IS 'Permite rechazar una invitación usando el token';
COMMENT ON FUNCTION public.aceptar_invitacion_sin_auth IS 'Acepta invitación sin requerir sesión previa, solo validando email y token';
COMMENT ON FUNCTION public.desvincular_playero_de_playas IS 'Desvincula playero de playas específicas, no lo elimina completamente';

-- 8. Permisos
GRANT EXECUTE ON FUNCTION public.verificar_email_existe TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rechazar_invitacion_playero TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.aceptar_invitacion_sin_auth TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.desvincular_playero_de_playas TO authenticated;

