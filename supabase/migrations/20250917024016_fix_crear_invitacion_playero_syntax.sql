-- =====================================================
-- MIGRACIÓN: CORREGIR ERROR DE SINTAXIS EN crear_invitacion_playero
-- =====================================================
-- Corrige el error de sintaxis en la función RPC crear_invitacion_playero

-- Recrear la función crear_invitacion_playero con la sintaxis corregida
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
    v_existing_user_id uuid;
    v_result json;
BEGIN
    -- Verificar que el dueño existe y tiene el rol correcto
    IF NOT EXISTS (
        SELECT 1 FROM public.rol_usuario 
        WHERE usuario_id = p_dueno_id AND rol = 'DUENO'
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Solo los dueños pueden invitar playeros'
        );
    END IF;
    
    -- Verificar que todas las playas pertenecen al dueño
    IF EXISTS (
        SELECT 1 FROM unnest(p_playas_ids) AS playa_id
        WHERE NOT EXISTS (
            SELECT 1 FROM public.playa p 
            WHERE p.playa_id = playa_id AND p.playa_dueno_id = p_dueno_id
        )
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Algunas playas no pertenecen al dueño'
        );
    END IF;
    
    -- Verificar si el email ya está registrado como usuario
    SELECT usuario_id INTO v_existing_user_id
    FROM public.usuario 
    WHERE email = p_email;
    
    -- Si el usuario ya existe, verificar si ya es playero de alguna de estas playas
    IF v_existing_user_id IS NOT NULL THEN
        IF EXISTS (
            SELECT 1 FROM public.playero_playa pp
            WHERE pp.playero_id = v_existing_user_id
            AND pp.playa_id = ANY(p_playas_ids)
            AND pp.dueno_invitador_id = p_dueno_id
        ) THEN
            RETURN json_build_object(
                'success', false,
                'error', 'El usuario ya es playero de alguna de estas playas'
            );
        END IF;
        
        -- Si es un dueño existente, crear invitación pero no asignar rol hasta que acepte
        IF EXISTS (
            SELECT 1 FROM public.rol_usuario 
            WHERE usuario_id = v_existing_user_id AND rol = 'DUENO'
        ) THEN
            -- Crear invitación pendiente para dueño existente
            INSERT INTO public.playero_invitacion (
                email, nombre, dueno_invitador_id, playas_ids
            ) VALUES (
                p_email, p_nombre, p_dueno_id, p_playas_ids
            ) RETURNING invitacion_id INTO v_invitacion_id;
            
            RETURN json_build_object(
                'success', true,
                'invitacion_id', v_invitacion_id,
                'message', 'Invitación creada para dueño existente (debe aceptar para evitar conflictos)',
                'requires_acceptance', true
            );
        END IF;
    END IF;
    
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
    
    -- Crear nueva invitación
    INSERT INTO public.playero_invitacion (
        email, nombre, dueno_invitador_id, playas_ids
    ) VALUES (
        p_email, p_nombre, p_dueno_id, p_playas_ids
    ) RETURNING invitacion_id INTO v_invitacion_id;
    
    RETURN json_build_object(
        'success', true,
        'invitacion_id', v_invitacion_id,
        'message', format('Invitación creada para %s', p_email),
        'requires_email', true
    );
END;
$$;
