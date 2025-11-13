-- =====================================================
-- MIGRACIÓN: MEJORAR LÓGICA DE GESTIÓN DE PLAYEROS
-- =====================================================
-- Implementa la nueva lógica de eliminación de playeros según especificaciones

-- 1. Función mejorada para eliminar playero con nueva lógica
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
                'message', format('Playero %s eliminado de %s playas y rol PLAYERO removido (sin asignaciones restantes)', 
                    v_playero_nombre, array_length(v_playas_del_dueno, 1))
            );
        ELSE
            v_result := json_build_object(
                'success', true,
                'action', 'deleted',
                'role_removed', false,
                'affected_playas', array_length(v_playas_del_dueno, 1),
                'message', format('Playero %s eliminado de %s playas (mantiene rol PLAYERO por %s asignaciones con otros dueños)', 
                    v_playero_nombre, array_length(v_playas_del_dueno, 1), v_total_relaciones_usuario)
            );
        END IF;
    END IF;
    
    RETURN v_result;
END;
$$;

-- 2. Función para obtener el estado consolidado de un playero
CREATE OR REPLACE FUNCTION public.obtener_estado_consolidado_playero(
    p_playero_id uuid,
    p_dueno_id uuid
) RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_estados text[];
    v_estado_consolidado text;
BEGIN
    -- Obtener todos los estados del playero en las playas de este dueño
    SELECT array_agg(DISTINCT pp.estado) INTO v_estados
    FROM public.playero_playa pp
    JOIN public.playa p ON pp.playa_id = p.playa_id
    WHERE pp.playero_id = p_playero_id
    AND p.playa_dueno_id = p_dueno_id;
    
    -- Lógica de consolidación de estados
    IF v_estados IS NULL OR array_length(v_estados, 1) = 0 THEN
        RETURN 'SIN_ASIGNACION';
    ELSIF 'ACTIVO' = ANY(v_estados) THEN
        -- Si tiene al menos una playa activa, se considera activo
        RETURN 'ACTIVO';
    ELSIF 'PENDIENTE' = ANY(v_estados) THEN
        -- Si no tiene activas pero tiene pendientes, se considera pendiente
        RETURN 'PENDIENTE';
    ELSE
        -- Si solo tiene suspendidas
        RETURN 'SUSPENDIDO';
    END IF;
END;
$$;

-- 3. Función para verificar si un usuario es playero de la playa actual
CREATE OR REPLACE FUNCTION public.es_playero_de_playa(
    p_usuario_id uuid,
    p_playa_id uuid
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.playero_playa pp
        WHERE pp.playero_id = p_usuario_id
        AND pp.playa_id = p_playa_id
        AND pp.estado = 'ACTIVO'
    );
END;
$$;

-- 4. Vista mejorada para playeros con estado consolidado
CREATE OR REPLACE VIEW public.playeros_con_estado_consolidado AS
WITH playeros_registrados AS (
    -- Playeros registrados agrupados por dueño con estado consolidado
    SELECT 
        pp.playero_id,
        pp.dueno_invitador_id,
        u.usuario_id,
        u.email,
        u.nombre,
        u.telefono,
        'REGISTRADO' as tipo_registro,
        -- Usar función para obtener estado consolidado
        public.obtener_estado_consolidado_playero(pp.playero_id, pp.dueno_invitador_id) as estado,
        MIN(pp.fecha_alta) as fecha_alta_principal,
        MAX(pp.fecha_baja) as fecha_baja_principal,
        string_agg(DISTINCT pp.motivo_baja, '; ') as motivo_baja_principal,
        MIN(pp.fecha_creacion) as fecha_creacion_principal,
        MAX(pp.fecha_modificacion) as fecha_modificacion_principal,
        -- Agregar información de playas asignadas para este dueño
        array_agg(
            json_build_object(
                'playa_id', p.playa_id,
                'nombre', p.nombre,
                'direccion', p.direccion,
                'estado', pp.estado,
                'fecha_alta', pp.fecha_alta,
                'fecha_baja', pp.fecha_baja
            ) ORDER BY pp.fecha_alta DESC NULLS LAST
        ) as playas_asignadas,
        count(pp.playa_id) as total_playas
    FROM public.playero_playa pp
    JOIN public.usuario u ON pp.playero_id = u.usuario_id
    JOIN public.playa p ON pp.playa_id = p.playa_id
    -- Filtrar solo por el dueño actual (se aplicará RLS)
    WHERE p.playa_dueno_id = pp.dueno_invitador_id
    GROUP BY pp.playero_id, pp.dueno_invitador_id, u.usuario_id, u.email, u.nombre, u.telefono
),
invitaciones_pendientes AS (
    -- Invitaciones pendientes agrupadas por email
    SELECT 
        null::uuid as playero_id,
        pi.dueno_invitador_id,
        null::uuid as usuario_id,
        pi.email,
        pi.nombre,
        null::text as telefono,
        'INVITACION_PENDIENTE' as tipo_registro,
        'PENDIENTE' as estado,
        null::timestamptz as fecha_alta_principal,
        null::timestamptz as fecha_baja_principal,
        null::text as motivo_baja_principal,
        pi.fecha_invitacion as fecha_creacion_principal,
        pi.fecha_invitacion as fecha_modificacion_principal,
        -- Agregar información de playas de la invitación
        array_agg(
            json_build_object(
                'playa_id', p.playa_id,
                'nombre', p.nombre,
                'direccion', p.direccion,
                'estado', 'PENDIENTE',
                'fecha_alta', null,
                'fecha_baja', null
            )
        ) as playas_asignadas,
        array_length(pi.playas_ids, 1) as total_playas
    FROM public.playero_invitacion pi
    JOIN public.playa p ON p.playa_id = ANY(pi.playas_ids)
    WHERE pi.estado = 'PENDIENTE' 
    AND pi.fecha_expiracion > now()
    -- Filtrar solo invitaciones del dueño actual (se aplicará RLS)
    AND p.playa_dueno_id = pi.dueno_invitador_id
    GROUP BY pi.invitacion_id, pi.dueno_invitador_id, pi.email, pi.nombre, pi.fecha_invitacion, pi.playas_ids
)
-- Unir ambos conjuntos
SELECT 
    playero_id,
    dueno_invitador_id,
    usuario_id,
    email,
    nombre,
    telefono,
    tipo_registro,
    estado,
    fecha_alta_principal as fecha_alta,
    fecha_baja_principal as fecha_baja,
    motivo_baja_principal as motivo_baja,
    fecha_creacion_principal as fecha_creacion,
    fecha_modificacion_principal as fecha_modificacion,
    playas_asignadas,
    total_playas
FROM playeros_registrados

UNION ALL

SELECT 
    playero_id,
    dueno_invitador_id,
    usuario_id,
    email,
    nombre,
    telefono,
    tipo_registro,
    estado,
    fecha_alta_principal as fecha_alta,
    fecha_baja_principal as fecha_baja,
    motivo_baja_principal as motivo_baja,
    fecha_creacion_principal as fecha_creacion,
    fecha_modificacion_principal as fecha_modificacion,
    playas_asignadas,
    total_playas
FROM invitaciones_pendientes;

-- Habilitar RLS en la nueva vista
ALTER VIEW public.playeros_con_estado_consolidado SET (security_invoker = true);

-- Comentarios para documentación
COMMENT ON FUNCTION public.eliminar_playero(uuid, uuid, text) IS 'Elimina todas las relaciones playero-playa de un dueño específico. Hace soft delete si hay referencias FK, elimina completamente si no las hay. Gestiona el rol PLAYERO según relaciones globales restantes.';
COMMENT ON FUNCTION public.obtener_estado_consolidado_playero(uuid, uuid) IS 'Obtiene el estado consolidado de un playero basado en todas sus asignaciones con un dueño específico';
COMMENT ON FUNCTION public.es_playero_de_playa(uuid, uuid) IS 'Verifica si un usuario es playero activo de una playa específica';
COMMENT ON VIEW public.playeros_con_estado_consolidado IS 'Vista mejorada que muestra playeros con estado consolidado basado en todas sus asignaciones por dueño';
