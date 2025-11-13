-- =====================================================
-- MIGRACIÓN: ARREGLAR ELIMINACIÓN DE PLAYEROS PARA LIMPIAR INVITACIONES
-- =====================================================
-- Actualiza la función eliminar_playero para que también elimine
-- las invitaciones pendientes relacionadas con el playero y dueño

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
    -- TODO: Agregar verificaciones de FK cuando se implementen otras tablas
    -- Ejemplo: v_es_referenciado := EXISTS (SELECT 1 FROM reservas WHERE playero_id = p_playero_id);
    -- Por ahora siempre es false hasta que se implementen otras tablas
    
    -- Obtener todas las playas del dueño donde está asignado este playero
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
    
    -- NUEVA FUNCIONALIDAD: Eliminar invitaciones pendientes del playero para este dueño
    -- Solo eliminar invitaciones que incluyan playas del dueño actual
    DELETE FROM public.playero_invitacion 
    WHERE email = v_playero_email 
    AND dueno_invitador_id = v_dueno_id
    AND estado IN ('PENDIENTE', 'EXPIRADA');
    
    GET DIAGNOSTICS v_invitaciones_eliminadas = ROW_COUNT;
    
    IF v_es_referenciado THEN
        -- Si está referenciado en otras tablas, hacer soft delete de todas las relaciones con este dueño
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
        -- Si no está referenciado, eliminar todas las relaciones con este dueño
        DELETE FROM public.playero_playa 
        WHERE playero_id = p_playero_id 
        AND playa_id = ANY(v_playas_del_dueno);
        
        -- Contar las relaciones totales restantes del usuario (con cualquier dueño)
        SELECT COUNT(*) INTO v_total_relaciones_usuario
        FROM public.playero_playa pp
        WHERE pp.playero_id = p_playero_id 
        AND pp.estado IN ('ACTIVO', 'SUSPENDIDO');
        
        -- Si no tiene relaciones con ningún dueño, eliminar el rol PLAYERO
        IF v_total_relaciones_usuario = 0 THEN
            DELETE FROM public.rol_usuario 
            WHERE usuario_id = p_playero_id AND rol = 'PLAYERO';
            
            v_result := json_build_object(
                'success', true,
                'action', 'deleted',
                'role_removed', true,
                'affected_playas', array_length(v_playas_del_dueno, 1),
                'invitations_deleted', v_invitaciones_eliminadas,
                'message', format('Playero %s eliminado de %s playas y rol PLAYERO removido (sin asignaciones restantes)', 
                    v_playero_nombre, array_length(v_playas_del_dueno, 1))
            );
        ELSE
            v_result := json_build_object(
                'success', true,
                'action', 'deleted',
                'role_removed', false,
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

-- Comentario actualizado
COMMENT ON FUNCTION public.eliminar_playero IS 
'Elimina un playero de las playas del dueño autenticado. También limpia invitaciones pendientes relacionadas. Si el playero no tiene más asignaciones, elimina el rol PLAYERO.';
