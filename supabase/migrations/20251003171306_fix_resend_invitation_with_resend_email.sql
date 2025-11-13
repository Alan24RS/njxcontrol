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
    v_playas_nombres text[];
    v_accepted_count integer;
    v_dueno_nombre text;
BEGIN
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
    
    SELECT nombre INTO v_dueno_nombre
    FROM public.usuario
    WHERE usuario_id = p_dueno_id;
    
    SELECT array_agg(nombre ORDER BY nombre) INTO v_playas_nombres
    FROM public.playa
    WHERE playa_id = ANY(v_playas_ids);
    
    DELETE FROM public.playero_invitacion 
    WHERE email = p_email 
    AND dueno_invitador_id = p_dueno_id;
    
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
    
    RETURN json_build_object(
        'success', true,
        'invitacion_id', v_invitacion_id,
        'email', p_email,
        'nombre', v_nombre,
        'playas_ids', v_playas_ids,
        'playas_nombres', v_playas_nombres,
        'dueno_nombre', v_dueno_nombre,
        'requires_email', true,
        'message', format('Nueva invitación creada y lista para enviar a %s', p_email)
    );
END;
$$;

COMMENT ON FUNCTION public.reenviar_invitacion_playero(text, uuid) IS 'Reenvía una invitación eliminando las anteriores y creando una nueva. Devuelve toda la información necesaria para enviar el email con Resend.';

