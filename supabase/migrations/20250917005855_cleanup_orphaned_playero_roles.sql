-- =====================================================
-- MIGRACIÓN: LIMPIAR ROLES PLAYERO HUÉRFANOS
-- =====================================================
-- Limpia roles PLAYERO de usuarios que no tienen relaciones playero_playa activas

-- Función para limpiar roles PLAYERO huérfanos
CREATE OR REPLACE FUNCTION public.limpiar_roles_playero_huerfanos()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_cleaned_count integer := 0;
    v_user_record record;
BEGIN
    -- Buscar usuarios con rol PLAYERO que no tienen relaciones playero_playa activas
    FOR v_user_record IN
        SELECT DISTINCT ru.usuario_id, u.email, u.nombre
        FROM public.rol_usuario ru
        JOIN public.usuario u ON ru.usuario_id = u.usuario_id
        WHERE ru.rol = 'PLAYERO'
        AND NOT EXISTS (
            SELECT 1 FROM public.playero_playa pp
            WHERE pp.playero_id = ru.usuario_id
            AND pp.estado IN ('ACTIVO', 'SUSPENDIDO')
        )
    LOOP
        -- Eliminar el rol PLAYERO huérfano
        DELETE FROM public.rol_usuario
        WHERE usuario_id = v_user_record.usuario_id
        AND rol = 'PLAYERO';
        
        v_cleaned_count := v_cleaned_count + 1;
        
        RAISE NOTICE 'Rol PLAYERO eliminado para usuario: % (%)', 
            v_user_record.nombre, v_user_record.email;
    END LOOP;
    
    RETURN json_build_object(
        'success', true,
        'cleaned_count', v_cleaned_count,
        'message', format('Se limpiaron %s roles PLAYERO huérfanos', v_cleaned_count)
    );
END;
$$;

-- Función para verificar roles huérfanos (solo lectura)
CREATE OR REPLACE FUNCTION public.verificar_roles_playero_huerfanos()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_orphaned_roles json;
BEGIN
    SELECT json_agg(
        json_build_object(
            'usuario_id', ru.usuario_id,
            'email', u.email,
            'nombre', u.nombre,
            'roles', array_agg(ru.rol)
        )
    ) INTO v_orphaned_roles
    FROM public.rol_usuario ru
    JOIN public.usuario u ON ru.usuario_id = u.usuario_id
    WHERE ru.rol = 'PLAYERO'
    AND NOT EXISTS (
        SELECT 1 FROM public.playero_playa pp
        WHERE pp.playero_id = ru.usuario_id
        AND pp.estado IN ('ACTIVO', 'SUSPENDIDO')
    )
    GROUP BY ru.usuario_id, u.email, u.nombre;
    
    RETURN json_build_object(
        'success', true,
        'orphaned_roles', COALESCE(v_orphaned_roles, '[]'::json),
        'count', COALESCE(json_array_length(v_orphaned_roles), 0)
    );
END;
$$;

-- Ejecutar la limpieza automáticamente al aplicar la migración
SELECT public.limpiar_roles_playero_huerfanos();

-- Comentarios para documentación
COMMENT ON FUNCTION public.limpiar_roles_playero_huerfanos() IS 'Limpia roles PLAYERO de usuarios que no tienen relaciones playero_playa activas';
COMMENT ON FUNCTION public.verificar_roles_playero_huerfanos() IS 'Verifica qué usuarios tienen roles PLAYERO sin relaciones playero_playa activas';
