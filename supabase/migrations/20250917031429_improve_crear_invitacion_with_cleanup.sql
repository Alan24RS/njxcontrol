-- =====================================================
-- MIGRACIÓN: MEJORAR FUNCIÓN CREAR INVITACIÓN CON LIMPIEZA AUTOMÁTICA
-- =====================================================
-- Mejora la función para limpiar automáticamente invitaciones expiradas antes de crear nuevas

-- Obtener la función actual para recrearla con mejoras
DO $$
BEGIN
    DROP FUNCTION IF EXISTS public.crear_invitacion_playero(text, text, uuid[], uuid);
END $$;

CREATE OR REPLACE FUNCTION public.crear_invitacion_playero(
    p_email text,
    p_nombre text,
    p_playas_ids uuid[],
    p_dueno_id uuid DEFAULT auth.uid()
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_invitacion_id uuid;
    v_usuario_existente uuid;
    v_ya_es_playero boolean := false;
    v_cleanup_result json;
BEGIN
    -- Validar que el dueño existe
    IF NOT EXISTS (SELECT 1 FROM public.usuario WHERE usuario_id = p_dueno_id) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Dueño no encontrado'
        );
    END IF;
    
    -- Validar que las playas existen y pertenecen al dueño
    IF EXISTS (
        SELECT 1 FROM unnest(p_playas_ids) AS playa_id
        WHERE NOT EXISTS (
            SELECT 1 FROM public.playa p 
            WHERE p.playa_id = playa_id 
            AND p.playa_dueno_id = p_dueno_id
        )
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Una o más playas no existen o no te pertenecen'
        );
    END IF;
    
    -- Limpiar invitaciones expiradas para este email y dueño antes de crear nueva
    DELETE FROM public.playero_invitacion 
    WHERE email = p_email 
    AND dueno_invitador_id = p_dueno_id
    AND estado = 'EXPIRADA';
    
    -- Verificar si ya existe una invitación pendiente
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
    
    -- Verificar si el usuario ya existe
    SELECT usuario_id INTO v_usuario_existente
    FROM public.usuario 
    WHERE email = p_email;
    
    -- Si el usuario existe, verificar si ya es playero de alguna de estas playas
    IF v_usuario_existente IS NOT NULL THEN
        SELECT EXISTS (
            SELECT 1 FROM public.playero_playa pp
            WHERE pp.playero_id = v_usuario_existente
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
    END IF;
    
    -- Crear la invitación
    INSERT INTO public.playero_invitacion (
        email, nombre, dueno_invitador_id, playas_ids
    ) VALUES (
        p_email, p_nombre, p_dueno_id, p_playas_ids
    ) RETURNING invitacion_id INTO v_invitacion_id;
    
    RETURN json_build_object(
        'success', true,
        'invitacion_id', v_invitacion_id,
        'message', format('Invitación creada para %s', p_email),
        'requires_email', v_usuario_existente IS NULL OR NOT EXISTS (
            SELECT 1 FROM auth.users WHERE email = p_email
        )
    );
END;
$$;
