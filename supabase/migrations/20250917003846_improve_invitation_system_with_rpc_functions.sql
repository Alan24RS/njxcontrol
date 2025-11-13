-- =====================================================
-- MIGRACIÓN: MEJORAR SISTEMA DE INVITACIONES CON RPC
-- =====================================================
-- Mejora el sistema de invitaciones con funciones RPC para gestión completa

-- 1. Función RPC para eliminar playero (con lógica de validación)
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
            'message', format('Playero %s suspendido de la playa (tiene referencias en el sistema)', v_playero_nombre)
        );
    ELSE
        -- Si no está referenciado, eliminar completamente
        DELETE FROM public.playero_playa 
        WHERE playero_id = p_playero_id AND playa_id = p_playa_id;
        
        v_result := json_build_object(
            'success', true,
            'action', 'deleted',
            'message', format('Playero %s eliminado de la playa', v_playero_nombre)
        );
    END IF;
    
    RETURN v_result;
END;
$$;

-- 2. Función RPC para reenviar invitación
CREATE OR REPLACE FUNCTION public.reenviar_invitacion_playero(
    p_email text,
    p_dueno_id uuid DEFAULT auth.uid()
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_invitacion_id uuid;
    v_nombre text;
    v_playas_ids uuid[];
    v_result json;
BEGIN
    -- Verificar que existe una invitación pendiente
    SELECT invitacion_id, nombre, playas_ids 
    INTO v_invitacion_id, v_nombre, v_playas_ids
    FROM public.playero_invitacion 
    WHERE email = p_email 
    AND dueno_invitador_id = p_dueno_id
    AND estado = 'PENDIENTE'
    AND fecha_expiracion > now()
    LIMIT 1;
    
    IF v_invitacion_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'No se encontró una invitación pendiente para este email'
        );
    END IF;
    
    -- Verificar que el playero no haya activado su cuenta
    IF EXISTS (
        SELECT 1 FROM public.playero_playa pp
        JOIN public.usuario u ON pp.playero_id = u.usuario_id
        WHERE u.email = p_email 
        AND pp.dueno_invitador_id = p_dueno_id
        AND pp.estado IN ('ACTIVO', 'SUSPENDIDO')
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'El playero ya ha activado su cuenta'
        );
    END IF;
    
    -- Actualizar fecha de invitación y extender expiración
    UPDATE public.playero_invitacion 
    SET fecha_invitacion = now(),
        fecha_expiracion = now() + interval '7 days',
        fecha_modificacion = now()
    WHERE invitacion_id = v_invitacion_id;
    
    -- Retornar información para que el frontend pueda reenviar el email
    RETURN json_build_object(
        'success', true,
        'invitacion_id', v_invitacion_id,
        'email', p_email,
        'nombre', v_nombre,
        'playas_ids', v_playas_ids,
        'message', format('Invitación reenviada a %s', p_email)
    );
END;
$$;

-- 3. Función RPC para obtener detalles de invitación (para el formulario de aceptación)
CREATE OR REPLACE FUNCTION public.obtener_detalles_invitacion(
    p_email text,
    p_dueno_id uuid
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_invitacion record;
    v_playas json;
    v_dueno_nombre text;
    v_result json;
BEGIN
    -- Obtener datos de la invitación
    SELECT * INTO v_invitacion
    FROM public.playero_invitacion 
    WHERE email = p_email 
    AND dueno_invitador_id = p_dueno_id
    AND estado = 'PENDIENTE'
    AND fecha_expiracion > now()
    LIMIT 1;
    
    IF v_invitacion IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Invitación no encontrada o expirada'
        );
    END IF;
    
    -- Obtener nombre del dueño
    SELECT nombre INTO v_dueno_nombre
    FROM public.usuario 
    WHERE usuario_id = p_dueno_id;
    
    -- Obtener detalles de las playas
    SELECT json_agg(
        json_build_object(
            'playa_id', p.playa_id,
            'nombre', p.nombre,
            'direccion', p.direccion,
            'descripcion', p.descripcion
        )
    ) INTO v_playas
    FROM public.playa p
    WHERE p.playa_id = ANY(v_invitacion.playas_ids);
    
    RETURN json_build_object(
        'success', true,
        'invitacion', json_build_object(
            'invitacion_id', v_invitacion.invitacion_id,
            'email', v_invitacion.email,
            'nombre_asignado', v_invitacion.nombre,
            'dueno_nombre', v_dueno_nombre,
            'fecha_invitacion', v_invitacion.fecha_invitacion,
            'fecha_expiracion', v_invitacion.fecha_expiracion,
            'playas', v_playas
        )
    );
END;
$$;

-- 4. Función RPC para aceptar invitación (llamada desde complete-registration)
CREATE OR REPLACE FUNCTION public.aceptar_invitacion_playero(
    p_email text,
    p_nombre_final text,
    p_auth_user_id uuid
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_invitacion record;
    v_result json;
BEGIN
    -- Buscar invitación pendiente
    SELECT * INTO v_invitacion
    FROM public.playero_invitacion 
    WHERE email = p_email 
    AND estado = 'PENDIENTE'
    AND fecha_expiracion > now()
    LIMIT 1;
    
    IF v_invitacion IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Invitación no encontrada o expirada'
        );
    END IF;
    
    -- Marcar invitación como aceptada
    UPDATE public.playero_invitacion 
    SET estado = 'ACEPTADA',
        fecha_aceptacion = now(),
        auth_user_id = p_auth_user_id
    WHERE invitacion_id = v_invitacion.invitacion_id;
    
    -- Crear usuario en tabla public.usuario si no existe
    INSERT INTO public.usuario (usuario_id, email, nombre)
    VALUES (p_auth_user_id, p_email, p_nombre_final)
    ON CONFLICT (usuario_id) DO UPDATE SET
        nombre = p_nombre_final,
        fecha_modificacion = now();
    
    -- Asignar rol PLAYERO
    INSERT INTO public.rol_usuario (usuario_id, rol)
    VALUES (p_auth_user_id, 'PLAYERO')
    ON CONFLICT (usuario_id, rol) DO NOTHING;
    
    -- Crear relaciones playero_playa para cada playa
    INSERT INTO public.playero_playa (
        playero_id, 
        playa_id, 
        dueno_invitador_id,
        estado
    )
    SELECT 
        p_auth_user_id,
        unnest(v_invitacion.playas_ids),
        v_invitacion.dueno_invitador_id,
        'ACTIVO'::playero_playa_estado
    ON CONFLICT (playero_id, playa_id) DO UPDATE SET
        estado = 'ACTIVO',
        fecha_modificacion = now();
    
    RETURN json_build_object(
        'success', true,
        'message', 'Invitación aceptada correctamente',
        'playas_asignadas', array_length(v_invitacion.playas_ids, 1)
    );
END;
$$;

-- 5. Eliminar función existente y recrear con nuevo tipo de retorno
DO $$
BEGIN
    DROP FUNCTION IF EXISTS public.crear_invitacion_playero(text, text, uuid[], uuid);
END $$;

-- Mejorar la función crear_invitacion_playero para usar la nueva tabla
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

-- 6. Eliminar función existente y recrear con nuevo tipo de retorno
DROP FUNCTION IF EXISTS public.limpiar_invitaciones_expiradas();

-- Función para limpiar invitaciones expiradas (mejorada)
CREATE OR REPLACE FUNCTION public.limpiar_invitaciones_expiradas()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_deleted_count integer;
BEGIN
    -- Marcar como expiradas las invitaciones vencidas
    UPDATE public.playero_invitacion 
    SET estado = 'EXPIRADA'
    WHERE estado = 'PENDIENTE' 
    AND fecha_expiracion <= now();
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    RETURN json_build_object(
        'success', true,
        'expired_count', v_deleted_count,
        'message', format('Se marcaron %s invitaciones como expiradas', v_deleted_count)
    );
END;
$$;

-- 7. Agregar columna fecha_modificacion a playero_invitacion si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'playero_invitacion' 
        AND column_name = 'fecha_modificacion'
    ) THEN
        ALTER TABLE public.playero_invitacion 
        ADD COLUMN fecha_modificacion timestamptz DEFAULT now();
    END IF;
END $$;

-- 8. Trigger para actualizar fecha_modificacion en playero_invitacion
CREATE OR REPLACE FUNCTION trg_update_fecha_modificacion_playero_invitacion()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.fecha_modificacion = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_fecha_modificacion_playero_invitacion ON public.playero_invitacion;
CREATE TRIGGER trg_update_fecha_modificacion_playero_invitacion
    BEFORE UPDATE ON public.playero_invitacion
    FOR EACH ROW
    EXECUTE FUNCTION trg_update_fecha_modificacion_playero_invitacion();

-- 9. Políticas RLS adicionales para las nuevas funciones
CREATE POLICY "duenos_can_manage_their_playeros" ON public.playero_playa
    FOR ALL TO authenticated
    USING (
        dueno_invitador_id = auth.uid() OR
        playero_id = auth.uid()
    )
    WITH CHECK (
        dueno_invitador_id = auth.uid() OR
        playero_id = auth.uid()
    );

-- 10. Comentarios para documentación
COMMENT ON FUNCTION public.eliminar_playero(uuid, uuid, text) IS 'Elimina o suspende un playero según si tiene referencias en otras tablas';
COMMENT ON FUNCTION public.reenviar_invitacion_playero(text, uuid) IS 'Reenvía una invitación pendiente extendiendo su fecha de expiración';
COMMENT ON FUNCTION public.obtener_detalles_invitacion(text, uuid) IS 'Obtiene los detalles de una invitación para mostrar en el formulario de aceptación';
COMMENT ON FUNCTION public.aceptar_invitacion_playero(text, text, uuid) IS 'Acepta una invitación y crea las relaciones playero-playa correspondientes';
COMMENT ON FUNCTION public.limpiar_invitaciones_expiradas() IS 'Marca como expiradas las invitaciones vencidas';
