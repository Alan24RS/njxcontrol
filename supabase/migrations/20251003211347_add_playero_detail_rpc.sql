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
                    WHEN COUNT(*) FILTER (WHERE estado = 'ACTIVO') > 0 THEN 'ACTIVO'
                    WHEN COUNT(*) FILTER (WHERE estado = 'SUSPENDIDO') > 0 THEN 'SUSPENDIDO'
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

GRANT EXECUTE ON FUNCTION public.obtener_detalle_playero(uuid, uuid) TO authenticated;
