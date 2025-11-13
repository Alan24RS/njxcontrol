DO $$
BEGIN
    DROP FUNCTION IF EXISTS public.crear_invitacion_playero(text, text, uuid[], uuid);
END $$;

CREATE OR REPLACE FUNCTION public.crear_invitacion_playero(
    p_email text,
    p_nombre text DEFAULT NULL,
    p_playas_ids uuid[] DEFAULT ARRAY[]::uuid[],
    p_dueno_id uuid DEFAULT auth.uid()
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_invitacion_id uuid;
    v_usuario_id uuid;
    v_usuario_nombre text;
    v_usuario_existe boolean := false;
    v_dueno_nombre text;
    v_playas_nombres text[];
    v_ya_es_playero boolean := false;
    v_nombre_guardado text;
BEGIN
    IF p_dueno_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Usuario no autenticado'
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.rol_usuario 
        WHERE usuario_id = p_dueno_id AND rol = 'DUENO'
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Solo los dueños pueden invitar playeros'
        );
    END IF;

    IF p_playas_ids IS NULL OR array_length(p_playas_ids, 1) = 0 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Debe asignar al menos una playa'
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.playa
        WHERE playa_id = ANY(p_playas_ids)
        AND playa_dueno_id = p_dueno_id
        HAVING COUNT(*) = array_length(p_playas_ids, 1)
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Algunas playas no pertenecen al dueño'
        );
    END IF;

    SELECT id, raw_user_meta_data->>'name'
    INTO v_usuario_id, v_usuario_nombre
    FROM auth.users
    WHERE email = p_email;

    IF v_usuario_id IS NOT NULL THEN
        v_usuario_existe := true;

        SELECT EXISTS (
            SELECT 1 FROM public.playero_playa pp
            WHERE pp.playero_id = v_usuario_id
            AND pp.playa_id = ANY(p_playas_ids)
            AND pp.dueno_invitador_id = p_dueno_id
            AND pp.estado IN ('ACTIVO', 'SUSPENDIDO')
        ) INTO v_ya_es_playero;

        IF v_ya_es_playero THEN
            RETURN json_build_object(
                'success', false,
                'error', 'El usuario ya es playero de una o más de estas playas'
            );
        END IF;
    ELSE
        IF p_nombre IS NULL OR trim(p_nombre) = '' THEN
            RETURN json_build_object(
                'success', false,
                'error', 'El nombre es requerido para nuevos usuarios'
            );
        END IF;
    END IF;

    IF EXISTS (
        SELECT 1 FROM public.playero_invitacion 
        WHERE email = p_email 
        AND dueno_invitador_id = p_dueno_id
        AND estado = 'PENDIENTE'
        AND fecha_expiracion > now()
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Ya existe una invitación pendiente para este email'
        );
    END IF;

    SELECT nombre INTO v_dueno_nombre
    FROM public.usuario
    WHERE usuario_id = p_dueno_id;

    SELECT array_agg(nombre) INTO v_playas_nombres
    FROM public.playa
    WHERE playa_id = ANY(p_playas_ids);

    v_nombre_guardado := COALESCE(v_usuario_nombre, p_nombre, 'Usuario');

    INSERT INTO public.playero_invitacion (
        email,
        nombre,
        dueno_invitador_id,
        playas_ids,
        estado,
        fecha_invitacion,
        fecha_expiracion
    ) VALUES (
        p_email,
        v_nombre_guardado,
        p_dueno_id,
        p_playas_ids,
        'PENDIENTE',
        now(),
        now() + interval '7 days'
    ) RETURNING invitacion_id INTO v_invitacion_id;

    RETURN json_build_object(
        'success', true,
        'invitacion_id', v_invitacion_id,
        'nombre', v_nombre_guardado,
        'message', format('Invitación creada para %s', p_email),
        'playas_nombres', v_playas_nombres,
        'dueno_nombre', v_dueno_nombre,
        'usuario_existe', v_usuario_existe,
        'requires_email', true
    );
END;
$$;

COMMENT ON FUNCTION public.crear_invitacion_playero IS 'Crea invitación para playero, detecta automáticamente si el usuario existe y retorna el nombre correcto';

