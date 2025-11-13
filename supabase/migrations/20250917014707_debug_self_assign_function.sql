-- =====================================================
-- MIGRACIÓN: DEBUG FUNCIÓN DE AUTO-ASIGNACIÓN
-- =====================================================
-- Función de debug para probar paso a paso la auto-asignación

-- Función de debug para auto-asignar un dueño como playero
CREATE OR REPLACE FUNCTION public.debug_auto_asignar_dueno_como_playero(
    p_playas_ids uuid[],
    p_dueno_id uuid DEFAULT auth.uid()
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_dueno_email text;
    v_dueno_nombre text;
    v_playa_id uuid;
    v_playas_validas uuid[] := '{}';
    v_playas_asignadas integer := 0;
    v_ya_tenia_rol boolean := false;
    v_debug_info json;
    v_result json;
    v_error_msg text;
BEGIN
    -- Verificar que el usuario está autenticado
    IF p_dueno_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Usuario no autenticado',
            'debug', json_build_object('step', 'auth_check', 'auth_uid', auth.uid())
        );
    END IF;
    
    -- Obtener datos del dueño
    SELECT u.email, u.nombre INTO v_dueno_email, v_dueno_nombre
    FROM public.usuario u
    WHERE u.usuario_id = p_dueno_id;
    
    IF v_dueno_email IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Usuario no encontrado',
            'debug', json_build_object('step', 'user_lookup', 'user_id', p_dueno_id)
        );
    END IF;
    
    -- Verificar que las playas pertenecen al dueño
    SELECT array_agg(p.playa_id) INTO v_playas_validas
    FROM public.playa p
    WHERE p.playa_id = ANY(p_playas_ids)
    AND p.playa_dueno_id = p_dueno_id;
    
    IF v_playas_validas IS NULL OR array_length(v_playas_validas, 1) = 0 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'No se encontraron playas válidas del usuario',
            'debug', json_build_object(
                'step', 'playa_validation', 
                'requested_playas', p_playas_ids,
                'user_id', p_dueno_id
            )
        );
    END IF;
    
    -- Verificar si ya tiene el rol PLAYERO
    v_ya_tenia_rol := EXISTS (
        SELECT 1 FROM public.rol_usuario 
        WHERE usuario_id = p_dueno_id AND rol = 'PLAYERO'
    );
    
    -- Asignar rol PLAYERO si no lo tiene
    IF NOT v_ya_tenia_rol THEN
        BEGIN
            INSERT INTO public.rol_usuario (usuario_id, rol)
            VALUES (p_dueno_id, 'PLAYERO')
            ON CONFLICT (usuario_id, rol) DO NOTHING;
        EXCEPTION WHEN OTHERS THEN
            RETURN json_build_object(
                'success', false,
                'error', 'Error al asignar rol PLAYERO: ' || SQLERRM,
                'debug', json_build_object('step', 'role_assignment', 'sqlstate', SQLSTATE)
            );
        END;
    END IF;
    
    -- Crear las relaciones playero_playa para cada playa seleccionada
    FOREACH v_playa_id IN ARRAY v_playas_validas
    LOOP
        -- Verificar si ya existe una relación
        IF NOT EXISTS (
            SELECT 1 FROM public.playero_playa 
            WHERE playero_id = p_dueno_id 
            AND playa_id = v_playa_id
            AND estado IN ('ACTIVO', 'SUSPENDIDO', 'PENDIENTE')
        ) THEN
            BEGIN
                -- Crear nueva relación
                INSERT INTO public.playero_playa (
                    playero_id,
                    playa_id,
                    dueno_invitador_id,
                    estado,
                    fecha_alta,
                    fecha_creacion,
                    fecha_modificacion
                ) VALUES (
                    p_dueno_id,
                    v_playa_id,
                    p_dueno_id,
                    'ACTIVO',
                    now(),
                    now(),
                    now()
                );
                
                v_playas_asignadas := v_playas_asignadas + 1;
            EXCEPTION WHEN OTHERS THEN
                v_error_msg := SQLERRM;
                RETURN json_build_object(
                    'success', false,
                    'error', 'Error al crear relación playero_playa: ' || v_error_msg,
                    'debug', json_build_object(
                        'step', 'playero_playa_insertion',
                        'playa_id', v_playa_id,
                        'playero_id', p_dueno_id,
                        'dueno_invitador_id', p_dueno_id,
                        'sqlstate', SQLSTATE,
                        'sqlerrm', v_error_msg
                    )
                );
            END;
        END IF;
    END LOOP;
    
    -- Construir resultado con debug info
    v_debug_info := json_build_object(
        'user_found', json_build_object('email', v_dueno_email, 'nombre', v_dueno_nombre),
        'playas_validas', v_playas_validas,
        'ya_tenia_rol', v_ya_tenia_rol,
        'playas_procesadas', array_length(v_playas_validas, 1),
        'playas_asignadas', v_playas_asignadas
    );
    
    v_result := json_build_object(
        'success', true,
        'playas_asignadas', v_playas_asignadas,
        'total_playas_solicitadas', array_length(v_playas_validas, 1),
        'rol_asignado', NOT v_ya_tenia_rol,
        'message', format('Te asignaste como playero en %s de %s playas solicitadas', 
            v_playas_asignadas, array_length(v_playas_validas, 1)),
        'debug', v_debug_info
    );
    
    RETURN v_result;
END;
$$;

-- Comentario
COMMENT ON FUNCTION public.debug_auto_asignar_dueno_como_playero(uuid[], uuid) IS 'Función de debug para auto-asignación de dueño como playero con información detallada de errores';
