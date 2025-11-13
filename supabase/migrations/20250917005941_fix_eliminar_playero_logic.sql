-- =====================================================
-- MIGRACIÓN: CORREGIR LÓGICA DE ELIMINAR_PLAYERO
-- =====================================================
-- Corrige la lógica de conteo en la función eliminar_playero

-- Función corregida para eliminar playero con lógica de conteo mejorada
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
    v_otras_relaciones_count integer := 0;
    v_result json;
BEGIN
    -- Verificar que el usuario autenticado es el dueño de la playa
    SELECT playa_dueno_id INTO v_dueno_id
    FROM public.playa 
    WHERE playa_id = p_playa_id;
    
    IF v_dueno_id != auth.uid() THEN
        RETURN json_build_object(
            'success', false,
            'error', 'No tienes permisos para eliminar playeros de esta playa'
        );
    END IF;
    
    -- Obtener datos del playero
    SELECT u.email, u.nombre INTO v_playero_email, v_playero_nombre
    FROM public.usuario u
    WHERE u.usuario_id = p_playero_id;
    
    -- Verificar si el playero está referenciado en otras tablas (futuras tablas como reservas, etc.)
    -- Por ahora solo verificamos que exista la relación
    IF NOT EXISTS (
        SELECT 1 FROM public.playero_playa 
        WHERE playero_id = p_playero_id AND playa_id = p_playa_id
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'La relación playero-playa no existe'
        );
    END IF;
    
    -- TODO: Agregar verificaciones de FK cuando se implementen otras tablas
    -- Ejemplo: reservas, turnos, etc.
    -- v_es_referenciado := EXISTS (SELECT 1 FROM reservas WHERE playero_id = p_playero_id);
    
    IF v_es_referenciado THEN
        -- Si está referenciado, suspender en lugar de eliminar
        UPDATE public.playero_playa 
        SET estado = 'SUSPENDIDO',
            fecha_baja = now(),
            motivo_baja = p_motivo,
            fecha_modificacion = now()
        WHERE playero_id = p_playero_id AND playa_id = p_playa_id;
        
        v_result := json_build_object(
            'success', true,
            'action', 'suspended',
            'role_removed', false,
            'message', format('Playero %s suspendido de la playa (tiene referencias en el sistema)', v_playero_nombre)
        );
    ELSE
        -- Si no está referenciado, eliminar completamente la relación
        DELETE FROM public.playero_playa 
        WHERE playero_id = p_playero_id AND playa_id = p_playa_id;
        
        -- DESPUÉS de eliminar, contar las relaciones restantes
        SELECT COUNT(*) INTO v_otras_relaciones_count
        FROM public.playero_playa pp
        WHERE pp.playero_id = p_playero_id 
        AND pp.estado IN ('ACTIVO', 'SUSPENDIDO');
        
        -- Si no tiene otras relaciones playero_playa activas, eliminar el rol PLAYERO
        IF v_otras_relaciones_count = 0 THEN
            DELETE FROM public.rol_usuario 
            WHERE usuario_id = p_playero_id AND rol = 'PLAYERO';
            
            v_result := json_build_object(
                'success', true,
                'action', 'deleted',
                'role_removed', true,
                'message', format('Playero %s eliminado de la playa y rol PLAYERO removido', v_playero_nombre)
            );
        ELSE
            v_result := json_build_object(
                'success', true,
                'action', 'deleted',
                'role_removed', false,
                'message', format('Playero %s eliminado de la playa (mantiene rol PLAYERO por %s asignaciones restantes)', v_playero_nombre, v_otras_relaciones_count)
            );
        END IF;
    END IF;
    
    RETURN v_result;
END;
$$;

-- Comentario actualizado para la función
COMMENT ON FUNCTION public.eliminar_playero(uuid, uuid, text) IS 'Elimina o suspende un playero según si tiene referencias en otras tablas. Gestiona automáticamente el rol PLAYERO según las relaciones restantes. CORREGIDO: cuenta relaciones DESPUÉS de eliminar.';
