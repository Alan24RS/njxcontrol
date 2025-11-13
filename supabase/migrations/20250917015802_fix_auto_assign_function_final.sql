-- =====================================================
-- MIGRACIÓN: CORRECCIÓN FINAL DE AUTO-ASIGNACIÓN
-- =====================================================
-- Corrige el problema de contexto de autenticación en las funciones RPC

-- 1. Función corregida que no depende de auth.uid() interno
CREATE OR REPLACE FUNCTION public.auto_asignar_dueno_como_playero(
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
    v_result json;
BEGIN
    -- Verificar que el usuario está autenticado
    IF p_dueno_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Usuario no autenticado'
        );
    END IF;
    
    -- Obtener datos del dueño
    SELECT u.email, u.nombre INTO v_dueno_email, v_dueno_nombre
    FROM public.usuario u
    WHERE u.usuario_id = p_dueno_id;
    
    IF v_dueno_email IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Usuario no encontrado en tabla usuario'
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
            'error', 'No se encontraron playas válidas del usuario'
        );
    END IF;
    
    IF array_length(v_playas_validas, 1) != array_length(p_playas_ids, 1) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Algunas playas no pertenecen al usuario'
        );
    END IF;
    
    -- Verificar si ya tiene el rol PLAYERO
    v_ya_tenia_rol := EXISTS (
        SELECT 1 FROM public.rol_usuario 
        WHERE usuario_id = p_dueno_id AND rol = 'PLAYERO'
    );
    
    -- Asignar rol PLAYERO si no lo tiene
    IF NOT v_ya_tenia_rol THEN
        INSERT INTO public.rol_usuario (usuario_id, rol)
        VALUES (p_dueno_id, 'PLAYERO')
        ON CONFLICT (usuario_id, rol) DO NOTHING;
    END IF;
    
    -- Crear las relaciones playero_playa para cada playa seleccionada
    FOREACH v_playa_id IN ARRAY v_playas_validas
    LOOP
        -- Verificar si ya existe una relación (activa, suspendida o pendiente)
        IF NOT EXISTS (
            SELECT 1 FROM public.playero_playa 
            WHERE playero_id = p_dueno_id 
            AND playa_id = v_playa_id
            AND estado IN ('ACTIVO', 'SUSPENDIDO', 'PENDIENTE')
        ) THEN
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
        END IF;
    END LOOP;
    
    -- Construir resultado
    v_result := json_build_object(
        'success', true,
        'playas_asignadas', v_playas_asignadas,
        'total_playas_solicitadas', array_length(v_playas_validas, 1),
        'rol_asignado', NOT v_ya_tenia_rol,
        'message', format('Te asignaste como playero en %s de %s playas solicitadas', 
            v_playas_asignadas, array_length(v_playas_validas, 1))
    );
    
    RETURN v_result;
END;
$$;

-- 2. Función para verificar si un dueño es playero (sin depender de RLS)
CREATE OR REPLACE FUNCTION public.verificar_dueno_es_playero(
    p_dueno_id uuid DEFAULT auth.uid()
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Verificar directamente en las tablas sin depender de RLS
    RETURN EXISTS (
        SELECT 1 
        FROM public.playero_playa pp
        JOIN public.playa p ON pp.playa_id = p.playa_id
        WHERE pp.playero_id = p_dueno_id
        AND p.playa_dueno_id = p_dueno_id
        AND pp.estado IN ('ACTIVO', 'SUSPENDIDO', 'PENDIENTE')
    );
END;
$$;

-- Comentarios actualizados
COMMENT ON FUNCTION public.auto_asignar_dueno_como_playero(uuid[], uuid) IS 'Función corregida para auto-asignación que no depende del contexto RLS interno';
COMMENT ON FUNCTION public.verificar_dueno_es_playero(uuid) IS 'Función corregida que verifica directamente en las tablas sin depender de RLS';
