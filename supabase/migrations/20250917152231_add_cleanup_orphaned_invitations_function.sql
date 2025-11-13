-- =====================================================
-- MIGRACIÓN: AGREGAR FUNCIÓN PARA LIMPIAR INVITACIONES HUÉRFANAS
-- =====================================================
-- Crea funciones para limpiar invitaciones que ya no tienen playero activo correspondiente

-- 1. Función para limpiar invitaciones huérfanas de un dueño específico
CREATE OR REPLACE FUNCTION public.cleanup_orphaned_invitations(
    p_dueno_id uuid DEFAULT auth.uid()
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_deleted_count integer := 0;
    v_invitations_cleaned text[];
BEGIN
    -- Verificar que el usuario es un dueño
    IF NOT EXISTS (
        SELECT 1 FROM public.rol_usuario 
        WHERE usuario_id = p_dueno_id AND rol = 'DUENO'
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Solo los dueños pueden limpiar invitaciones'
        );
    END IF;
    
    -- Obtener emails de invitaciones huérfanas antes de eliminarlas
    SELECT array_agg(email) INTO v_invitations_cleaned
    FROM public.playero_invitacion pi
    WHERE pi.dueno_invitador_id = p_dueno_id
    AND pi.estado = 'ACEPTADA'
    AND NOT EXISTS (
        -- No existe playero activo con ese email para este dueño
        SELECT 1 FROM public.playero_playa pp
        JOIN public.usuario u ON pp.playero_id = u.usuario_id
        WHERE u.email = pi.email
        AND pp.dueno_invitador_id = p_dueno_id
        AND pp.estado IN ('ACTIVO', 'SUSPENDIDO')
    );
    
    -- Eliminar invitaciones huérfanas (ACEPTADAS sin playero activo correspondiente)
    DELETE FROM public.playero_invitacion 
    WHERE dueno_invitador_id = p_dueno_id
    AND estado = 'ACEPTADA'
    AND NOT EXISTS (
        -- No existe playero activo con ese email para este dueño
        SELECT 1 FROM public.playero_playa pp
        JOIN public.usuario u ON pp.playero_id = u.usuario_id
        WHERE u.email = playero_invitacion.email
        AND pp.dueno_invitador_id = p_dueno_id
        AND pp.estado IN ('ACTIVO', 'SUSPENDIDO')
    );
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    RETURN json_build_object(
        'success', true,
        'deleted_count', v_deleted_count,
        'cleaned_emails', COALESCE(v_invitations_cleaned, ARRAY[]::text[]),
        'message', format('Se limpiaron %s invitaciones huérfanas', v_deleted_count)
    );
END;
$$;

-- 2. Función para encontrar invitaciones huérfanas (solo consulta)
CREATE OR REPLACE FUNCTION public.find_orphaned_invitations(
    p_dueno_id uuid DEFAULT auth.uid()
) RETURNS TABLE(
    invitacion_id uuid,
    email text,
    estado text,
    fecha_aceptacion timestamptz,
    playas_ids uuid[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pi.invitacion_id,
        pi.email,
        pi.estado::text,
        pi.fecha_aceptacion,
        pi.playas_ids
    FROM public.playero_invitacion pi
    WHERE pi.dueno_invitador_id = p_dueno_id
    AND pi.estado = 'ACEPTADA'
    AND NOT EXISTS (
        -- No existe playero activo con ese email para este dueño
        SELECT 1 FROM public.playero_playa pp
        JOIN public.usuario u ON pp.playero_id = u.usuario_id
        WHERE u.email = pi.email
        AND pp.dueno_invitador_id = p_dueno_id
        AND pp.estado IN ('ACTIVO', 'SUSPENDIDO')
    );
END;
$$;

-- 3. Mejorar la función eliminar_playero para limpiar TODAS las invitaciones relacionadas
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
    
    -- MEJORADO: Eliminar TODAS las invitaciones del playero para este dueño (cualquier estado)
    DELETE FROM public.playero_invitacion 
    WHERE email = v_playero_email 
    AND dueno_invitador_id = v_dueno_id;
    
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

-- 4. Comentarios
COMMENT ON FUNCTION public.cleanup_orphaned_invitations IS 
'Limpia invitaciones ACEPTADAS que ya no tienen un playero activo correspondiente para el dueño especificado';

COMMENT ON FUNCTION public.find_orphaned_invitations IS 
'Encuentra invitaciones huérfanas (ACEPTADAS sin playero activo) para el dueño especificado';

COMMENT ON FUNCTION public.eliminar_playero IS 
'Elimina un playero de las playas del dueño autenticado. También limpia TODAS las invitaciones relacionadas (cualquier estado). Si el playero no tiene más asignaciones, elimina el rol PLAYERO.';
