-- =====================================================
-- MIGRACIÓN: CORRECCIÓN DE ERRORES DE LINT
-- =====================================================
-- Corrige 3 errores críticos detectados por supabase db lint.
-- Aunque algunas funciones ya fueron corregidas en migraciones anteriores,
-- el linter analiza todas las migraciones históricas y reporta errores
-- en las definiciones originales. Esta migración asegura que las funciones
-- estén correctamente definidas para eliminar los errores del linter.

-- =====================================================
-- ERROR 1: Corregir tipo de parámetro en _assert_usuario_tiene_rol
-- =====================================================
-- El error aparece en 20250907144140 aunque fue parcialmente corregido en 20250907145353
-- Recreamos la función para asegurar consistencia
CREATE OR REPLACE FUNCTION public._assert_usuario_tiene_rol(p_usuario_id uuid, p_rol rol)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.rol_usuario
     WHERE usuario_id = p_usuario_id AND rol = p_rol
  ) THEN
    RAISE EXCEPTION 'El usuario % no posee el rol requerido: %', p_usuario_id, p_rol
      USING ERRCODE = '23514';
  END IF;
END;
$$;

-- =====================================================
-- ERROR 2: Corregir agregación anidada en verificar_roles_playero_huerfanos
-- =====================================================
-- El error está en 20250917005855 (array_agg dentro de json_agg no está permitido)
-- Usamos CTE para pre-agregar roles antes de json_agg
CREATE OR REPLACE FUNCTION public.verificar_roles_playero_huerfanos()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_orphaned_roles json;
BEGIN
    -- Usar CTE para evitar anidar array_agg dentro de json_agg
    WITH roles_agrupados AS (
        SELECT 
            ru.usuario_id,
            u.email,
            u.nombre,
            array_agg(ru.rol) as roles
        FROM public.rol_usuario ru
        JOIN public.usuario u ON ru.usuario_id = u.usuario_id
        WHERE ru.rol = 'PLAYERO'
        AND NOT EXISTS (
            SELECT 1 FROM public.playero_playa pp
            WHERE pp.playero_id = ru.usuario_id
            AND pp.estado IN ('ACTIVO', 'SUSPENDIDO')
        )
        GROUP BY ru.usuario_id, u.email, u.nombre
    )
    SELECT json_agg(
        json_build_object(
            'usuario_id', usuario_id,
            'email', email,
            'nombre', nombre,
            'roles', roles
        )
    ) INTO v_orphaned_roles
    FROM roles_agrupados;
    
    RETURN json_build_object(
        'success', true,
        'orphaned_roles', COALESCE(v_orphaned_roles, '[]'::json),
        'count', COALESCE(json_array_length(v_orphaned_roles), 0)
    );
END;
$$;

-- =====================================================
-- ERROR 3: Corregir referencia ambigua de 'estado' en obtener_detalle_playero
-- =====================================================
-- El error está en 20251003211347 (columna 'estado' ambigua en JOIN)
-- Cualificamos explícitamente la columna estado como pp.estado
CREATE OR REPLACE FUNCTION public.obtener_detalle_playero(
    p_playero_id uuid,
    p_dueno_id uuid DEFAULT auth.uid()
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_playero_data json;
    v_playas json;
BEGIN
    -- Verificación de sesión
    IF p_dueno_id IS NULL THEN
        RAISE EXCEPTION 'Usuario no autenticado';
    END IF;

    -- Solo dueños pueden acceder
    IF NOT EXISTS (
        SELECT 1 FROM public.rol_usuario
        WHERE usuario_id = p_dueno_id AND rol = 'DUENO'
    ) THEN
        RAISE EXCEPTION 'Solo los dueños pueden ver detalles de playeros';
    END IF;

    -- Datos generales del playero (usuario)
    SELECT json_build_object(
        'playero_id', u.usuario_id,
        'nombre', u.nombre,
        'email', u.email,
        'telefono', u.telefono,
        -- Toma la primera fecha de alta en playero_playa
        'fecha_alta', (
            SELECT MIN(pp.fecha_alta)
            FROM public.playero_playa pp
            JOIN public.playa pl ON pl.playa_id = pp.playa_id
            WHERE pp.playero_id = u.usuario_id
              AND pl.playa_dueno_id = p_dueno_id
        ),
        'estado_global', COALESCE(
            (
                SELECT CASE
                    WHEN COUNT(*) FILTER (WHERE pp.estado = 'ACTIVO') > 0 THEN 'ACTIVO'
                    WHEN COUNT(*) FILTER (WHERE pp.estado = 'SUSPENDIDO') > 0 THEN 'SUSPENDIDO'
                    ELSE 'INACTIVO'
                END
                FROM public.playero_playa pp
                JOIN public.playa pl ON pl.playa_id = pp.playa_id
                WHERE pp.playero_id = u.usuario_id
                  AND pl.playa_dueno_id = p_dueno_id
            ),
            'INACTIVO'
        )
    )
    INTO v_playero_data
    FROM public.usuario u
    WHERE u.usuario_id = p_playero_id;

    IF v_playero_data IS NULL THEN
        RAISE EXCEPTION 'Playero no encontrado';
    END IF;

    -- Playas donde trabaja ese playero
    SELECT COALESCE(json_agg(
        json_build_object(
            'playa_id', pl.playa_id,
            'playa_nombre', pl.nombre,
            'playa_direccion', pl.direccion,
            'estado', pp.estado,
            'fecha_asignacion', pp.fecha_alta
        )
        ORDER BY pl.nombre
    ), '[]'::json)
    INTO v_playas
    FROM public.playero_playa pp
    JOIN public.playa pl ON pl.playa_id = pp.playa_id
    WHERE pp.playero_id = p_playero_id
      AND pl.playa_dueno_id = p_dueno_id;

    -- Retorna el JSON final
    RETURN json_build_object(
        'playero_id', (v_playero_data->>'playero_id')::uuid,
        'nombre', v_playero_data->>'nombre',
        'email', v_playero_data->>'email',
        'telefono', v_playero_data->>'telefono',
        'fecha_alta', v_playero_data->>'fecha_alta',
        'estado_global', v_playero_data->>'estado_global',
        'playas', v_playas
    );
END;
$$;

-- Mantener los permisos existentes
GRANT EXECUTE ON FUNCTION public.obtener_detalle_playero(uuid, uuid) TO authenticated;

-- =====================================================
-- COMENTARIOS SOBRE LAS CORRECCIONES
-- =====================================================
-- Esta migración corrige 3 errores críticos del linter:
-- 1. _assert_usuario_tiene_rol: Acepta uuid directamente (ya corregido en 20250907145353, recreado por consistencia)
-- 2. verificar_roles_playero_huerfanos: Usa CTE para evitar array_agg anidado dentro de json_agg
-- 3. obtener_detalle_playero: Califica pp.estado explícitamente en el FILTER WHERE para evitar ambigüedad
--
-- Nota: Aunque algunas funciones ya fueron parcialmente corregidas en migraciones previas,
-- el linter de Supabase analiza todas las definiciones históricas en los archivos de migración,
-- por lo que esta migración asegura que el estado final sea correcto y sin errores de lint.
