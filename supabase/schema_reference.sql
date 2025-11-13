

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE TYPE "public"."metodo_pago" AS ENUM (
    'EFECTIVO',
    'TRANSFERENCIA',
    'MERCADO_PAGO'
);


ALTER TYPE "public"."metodo_pago" OWNER TO "postgres";


CREATE TYPE "public"."metodo_pago_estado" AS ENUM (
    'ACTIVO',
    'SUSPENDIDO'
);


ALTER TYPE "public"."metodo_pago_estado" OWNER TO "postgres";


CREATE TYPE "public"."modalidad_ocupacion" AS ENUM (
    'POR_HORA',
    'DIARIA',
    'SEMANAL',
    'MENSUAL'
);


ALTER TYPE "public"."modalidad_ocupacion" OWNER TO "postgres";


CREATE TYPE "public"."modalidad_ocupacion_playa_estado" AS ENUM (
    'ACTIVO',
    'SUSPENDIDO'
);


ALTER TYPE "public"."modalidad_ocupacion_playa_estado" OWNER TO "postgres";


CREATE TYPE "public"."playa_estado" AS ENUM (
    'BORRADOR',
    'ACTIVO',
    'SUSPENDIDO'
);


ALTER TYPE "public"."playa_estado" OWNER TO "postgres";


COMMENT ON TYPE "public"."playa_estado" IS 'Estados que puede tener una playa durante el tiempo';



CREATE TYPE "public"."playero_playa_estado" AS ENUM (
    'ACTIVO',
    'SUSPENDIDO',
    'PENDIENTE',
    'RECHAZADA'
);


ALTER TYPE "public"."playero_playa_estado" OWNER TO "postgres";


CREATE TYPE "public"."plaza_estado" AS ENUM (
    'ACTIVO',
    'SUSPENDIDO'
);


ALTER TYPE "public"."plaza_estado" OWNER TO "postgres";


CREATE TYPE "public"."rol" AS ENUM (
    'DUENO',
    'PLAYERO'
);


ALTER TYPE "public"."rol" OWNER TO "postgres";


CREATE TYPE "public"."tipo_vehiculo" AS ENUM (
    'AUTOMOVIL',
    'MOTOCICLETA',
    'CAMIONETA'
);


ALTER TYPE "public"."tipo_vehiculo" OWNER TO "postgres";


CREATE TYPE "public"."tipo_vehiculo_estado" AS ENUM (
    'ACTIVO',
    'SUSPENDIDO'
);


ALTER TYPE "public"."tipo_vehiculo_estado" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."_assert_usuario_tiene_rol"("p_usuario_id" integer, "p_rol" "public"."rol") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.rol_usuario
     WHERE usuario_id = p_usuario_id::uuid AND rol = p_rol
  ) THEN
    RAISE EXCEPTION 'El usuario % no posee el rol requerido: %', p_usuario_id, p_rol
      USING ERRCODE = '23514';
  END IF;
END;
$$;


ALTER FUNCTION "public"."_assert_usuario_tiene_rol"("p_usuario_id" integer, "p_rol" "public"."rol") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."_assert_usuario_tiene_rol"("p_usuario_id" "uuid", "p_rol" "public"."rol") RETURNS "void"
    LANGUAGE "plpgsql"
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


ALTER FUNCTION "public"."_assert_usuario_tiene_rol"("p_usuario_id" "uuid", "p_rol" "public"."rol") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."aceptar_invitacion_playero"("p_email" "text", "p_nombre_final" "text", "p_auth_user_id" "uuid") RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."aceptar_invitacion_playero"("p_email" "text", "p_nombre_final" "text", "p_auth_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."aceptar_invitacion_playero"("p_email" "text", "p_nombre_final" "text", "p_auth_user_id" "uuid") IS 'Función que se ejecuta cuando el usuario completa el formulario de registro. Crea las relaciones playero_playa con estado ACTIVO';



CREATE OR REPLACE FUNCTION "public"."aceptar_invitacion_playero_por_token"("p_token" "text", "p_auth_user_id" "uuid", "p_nombre_final" "text") RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_invitacion public.playero_invitacion;
    v_playas_count integer;
    v_user_exists boolean;
    v_orphaned_user_id uuid;
    v_already_processed boolean := false;
BEGIN
    -- Buscar invitación (PENDIENTE o ya ACEPTADA por el mismo usuario)
    SELECT * INTO v_invitacion
    FROM public.playero_invitacion 
    WHERE invitacion_id::text = p_token
    AND fecha_expiracion > now()
    AND (
        estado = 'PENDIENTE' 
        OR (estado = 'ACEPTADA' AND auth_user_id = p_auth_user_id)
    );
    
    IF v_invitacion IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Token inválido, expirado o ya utilizado por otro usuario'
        );
    END IF;
    
    -- Si ya está ACEPTADA por el mismo usuario, verificar si todo está en orden
    IF v_invitacion.estado = 'ACEPTADA' AND v_invitacion.auth_user_id = p_auth_user_id THEN
        -- Verificar si el usuario existe en public.usuario y tiene las relaciones correctas
        IF EXISTS (
            SELECT 1 FROM public.usuario WHERE usuario_id = p_auth_user_id
        ) AND EXISTS (
            SELECT 1 FROM public.playero_playa pp
            WHERE pp.playero_id = p_auth_user_id
            AND pp.playa_id = ANY(v_invitacion.playas_ids)
            AND pp.estado = 'ACTIVO'
        ) THEN
            -- Todo está en orden, devolver éxito
            SELECT array_length(v_invitacion.playas_ids, 1) INTO v_playas_count;
            
            RETURN json_build_object(
                'success', true,
                'message', format('Invitación ya procesada correctamente. Usuario asignado a %s playas', v_playas_count),
                'playas_asignadas', v_playas_count,
                'already_processed', true
            );
        ELSE
            -- Está marcada como ACEPTADA pero faltan datos, continuar con el procesamiento
            v_already_processed := true;
        END IF;
    END IF;
    
    -- Verificar si hay un usuario huérfano con este email
    SELECT usuario_id INTO v_orphaned_user_id
    FROM public.usuario 
    WHERE email = v_invitacion.email
    AND usuario_id != p_auth_user_id
    AND NOT EXISTS (SELECT 1 FROM auth.users WHERE id = usuario_id);
    
    -- Limpiar usuario huérfano si existe
    IF v_orphaned_user_id IS NOT NULL THEN
        DELETE FROM public.playero_playa WHERE playero_id = v_orphaned_user_id;
        DELETE FROM public.rol_usuario WHERE usuario_id = v_orphaned_user_id;
        DELETE FROM public.usuario WHERE usuario_id = v_orphaned_user_id;
    END IF;
    
    -- Marcar invitación como aceptada (solo si no estaba ya ACEPTADA)
    IF NOT v_already_processed THEN
        UPDATE public.playero_invitacion 
        SET estado = 'ACEPTADA',
            fecha_aceptacion = now(),
            auth_user_id = p_auth_user_id
        WHERE invitacion_id = v_invitacion.invitacion_id;
    END IF;
    
    -- Crear usuario en public.usuario (idempotente)
    INSERT INTO public.usuario (usuario_id, email, nombre)
    VALUES (p_auth_user_id, v_invitacion.email, p_nombre_final)
    ON CONFLICT (usuario_id) DO UPDATE SET
        nombre = excluded.nombre,
        fecha_modificacion = now();
    
    -- Asignar rol PLAYERO (idempotente)
    INSERT INTO public.rol_usuario (usuario_id, rol)
    VALUES (p_auth_user_id, 'PLAYERO')
    ON CONFLICT (usuario_id, rol) DO NOTHING;
    
    -- Crear relaciones playero_playa para cada playa asignada (idempotente)
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
    
    -- Contar playas asignadas
    GET DIAGNOSTICS v_playas_count = ROW_COUNT;
    
    -- Si no se insertó nada, contar las existentes
    IF v_playas_count = 0 THEN
        SELECT COUNT(*) INTO v_playas_count
        FROM public.playero_playa pp
        WHERE pp.playero_id = p_auth_user_id
        AND pp.playa_id = ANY(v_invitacion.playas_ids)
        AND pp.estado = 'ACTIVO';
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'message', format('Invitación procesada exitosamente. Usuario asignado a %s playas', v_playas_count),
        'playas_asignadas', v_playas_count,
        'already_processed', v_already_processed,
        'orphaned_cleaned', v_orphaned_user_id IS NOT NULL
    );
END;
$$;


ALTER FUNCTION "public"."aceptar_invitacion_playero_por_token"("p_token" "text", "p_auth_user_id" "uuid", "p_nombre_final" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."aceptar_invitacion_playero_por_token"("p_token" "text", "p_auth_user_id" "uuid", "p_nombre_final" "text") IS 'Acepta una invitación de forma idempotente. Se puede ejecutar múltiples veces sin problemas. Limpia usuarios huérfanos automáticamente y crea las relaciones playero_playa';



CREATE OR REPLACE FUNCTION "public"."aceptar_invitacion_sin_auth"("p_token" "text", "p_email" "text") RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_invitacion public.playero_invitacion;
    v_usuario_id uuid;
    v_playas_count integer;
    v_tiene_rol_playero boolean;
BEGIN
    SELECT * INTO v_invitacion
    FROM public.playero_invitacion 
    WHERE invitacion_id::text = p_token
    AND email = p_email
    AND estado = 'PENDIENTE'
    AND fecha_expiracion > now();
    
    IF v_invitacion IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Invitación no encontrada, expirada o el email no coincide'
        );
    END IF;
    
    SELECT id INTO v_usuario_id
    FROM auth.users
    WHERE email = p_email;
    
    IF v_usuario_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'El usuario debe completar su registro primero'
        );
    END IF;
    
    UPDATE public.playero_invitacion 
    SET estado = 'ACEPTADA',
        fecha_aceptacion = now(),
        auth_user_id = v_usuario_id
    WHERE invitacion_id = v_invitacion.invitacion_id;
    
    SELECT EXISTS(
        SELECT 1 FROM public.rol_usuario 
        WHERE usuario_id = v_usuario_id AND rol = 'PLAYERO'
    ) INTO v_tiene_rol_playero;
    
    IF NOT v_tiene_rol_playero THEN
        INSERT INTO public.rol_usuario (usuario_id, rol)
        VALUES (v_usuario_id, 'PLAYERO')
        ON CONFLICT (usuario_id, rol) DO NOTHING;
    END IF;
    
    INSERT INTO public.playero_playa (
        playero_id, 
        playa_id, 
        dueno_invitador_id,
        estado
    )
    SELECT 
        v_usuario_id,
        unnest(v_invitacion.playas_ids),
        v_invitacion.dueno_invitador_id,
        'ACTIVO'::playero_playa_estado
    ON CONFLICT (playero_id, playa_id) DO UPDATE SET
        estado = 'ACTIVO',
        dueno_invitador_id = EXCLUDED.dueno_invitador_id,
        fecha_modificacion = now();
    
    GET DIAGNOSTICS v_playas_count = ROW_COUNT;
    
    RETURN json_build_object(
        'success', true,
        'message', format('Ahora puedes trabajar en %s playas', v_playas_count),
        'playas_asignadas', v_playas_count
    );
END;
$$;


ALTER FUNCTION "public"."aceptar_invitacion_sin_auth"("p_token" "text", "p_email" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."aceptar_invitacion_sin_auth"("p_token" "text", "p_email" "text") IS 'Acepta invitación sin requerir sesión previa, solo validando email y token';



CREATE OR REPLACE FUNCTION "public"."aceptar_invitacion_usuario_existente"("p_token" "text", "p_auth_user_id" "uuid") RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_invitacion public.playero_invitacion;
    v_playas_count integer;
    v_tiene_rol_playero boolean;
BEGIN
    UPDATE public.playero_invitacion 
    SET estado = 'ACEPTADA',
        fecha_aceptacion = now(),
        auth_user_id = p_auth_user_id
    WHERE invitacion_id::text = p_token
    AND estado = 'PENDIENTE'
    AND fecha_expiracion > now()
    RETURNING * INTO v_invitacion;
    
    IF v_invitacion IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Token inválido o expirado'
        );
    END IF;
    
    SELECT EXISTS(
        SELECT 1 FROM public.rol_usuario 
        WHERE usuario_id = p_auth_user_id AND rol = 'PLAYERO'
    ) INTO v_tiene_rol_playero;
    
    IF NOT v_tiene_rol_playero THEN
        INSERT INTO public.rol_usuario (usuario_id, rol)
        VALUES (p_auth_user_id, 'PLAYERO')
        ON CONFLICT (usuario_id, rol) DO NOTHING;
    END IF;
    
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
        dueno_invitador_id = EXCLUDED.dueno_invitador_id,
        fecha_modificacion = now();
    
    GET DIAGNOSTICS v_playas_count = ROW_COUNT;
    
    RETURN json_build_object(
        'success', true,
        'message', format('Ahora puedes trabajar en %s playas', v_playas_count),
        'playas_asignadas', v_playas_count
    );
END;
$$;


ALTER FUNCTION "public"."aceptar_invitacion_usuario_existente"("p_token" "text", "p_auth_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."aceptar_invitacion_usuario_existente"("p_token" "text", "p_auth_user_id" "uuid") IS 'Acepta invitación para usuarios que ya tienen cuenta en el sistema';



CREATE OR REPLACE FUNCTION "public"."aprobar_playero"("p_playero_id" "uuid", "p_playa_id" "uuid", "p_dueno_id" "uuid" DEFAULT "auth"."uid"()) RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_affected_rows integer;
BEGIN
    -- Verificar que el dueño tiene permisos sobre la playa
    IF NOT EXISTS (
        SELECT 1 FROM public.playa 
        WHERE playa_id = p_playa_id 
        AND playa_dueno_id = p_dueno_id
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'No tienes permisos sobre esta playa'
        );
    END IF;
    
    -- Verificar que existe la relación pendiente
    IF NOT EXISTS (
        SELECT 1 FROM public.playero_playa 
        WHERE playero_id = p_playero_id 
        AND playa_id = p_playa_id 
        AND dueno_invitador_id = p_dueno_id
        AND estado = 'PENDIENTE'
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'No se encontró una invitación pendiente para este playero en esta playa'
        );
    END IF;
    
    -- Aprobar el playero (cambiar estado a ACTIVO)
    UPDATE public.playero_playa 
    SET estado = 'ACTIVO',
        fecha_alta = now(),
        fecha_modificacion = now()
    WHERE playero_id = p_playero_id 
    AND playa_id = p_playa_id 
    AND dueno_invitador_id = p_dueno_id
    AND estado = 'PENDIENTE';
    
    GET DIAGNOSTICS v_affected_rows = ROW_COUNT;
    
    IF v_affected_rows > 0 THEN
        RETURN json_build_object(
            'success', true,
            'message', 'Playero aprobado correctamente'
        );
    ELSE
        RETURN json_build_object(
            'success', false,
            'error', 'No se pudo aprobar el playero'
        );
    END IF;
END;
$$;


ALTER FUNCTION "public"."aprobar_playero"("p_playero_id" "uuid", "p_playa_id" "uuid", "p_dueno_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."aprobar_playero"("p_playero_id" "uuid", "p_playa_id" "uuid", "p_dueno_id" "uuid") IS 'Función para aprobar un playero que está en estado PENDIENTE y cambiar su estado a ACTIVO';



CREATE OR REPLACE FUNCTION "public"."aprobar_todos_playeros_pendientes"("p_dueno_id" "uuid" DEFAULT "auth"."uid"()) RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_affected_rows integer;
BEGIN
    -- Aprobar todos los playeros pendientes del dueño
    UPDATE public.playero_playa 
    SET estado = 'ACTIVO',
        fecha_alta = now(),
        fecha_modificacion = now()
    WHERE dueno_invitador_id = p_dueno_id
    AND estado = 'PENDIENTE';
    
    GET DIAGNOSTICS v_affected_rows = ROW_COUNT;
    
    RETURN json_build_object(
        'success', true,
        'approved_count', v_affected_rows,
        'message', format('Se aprobaron %s playeros pendientes', v_affected_rows)
    );
END;
$$;


ALTER FUNCTION "public"."aprobar_todos_playeros_pendientes"("p_dueno_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."aprobar_todos_playeros_pendientes"("p_dueno_id" "uuid") IS 'Función para aprobar todos los playeros pendientes de un dueño de una vez';



CREATE OR REPLACE FUNCTION "public"."auto_asignar_dueno_como_playero"("p_playas_ids" "uuid"[], "p_dueno_id" "uuid" DEFAULT "auth"."uid"()) RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."auto_asignar_dueno_como_playero"("p_playas_ids" "uuid"[], "p_dueno_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."auto_asignar_dueno_como_playero"("p_playas_ids" "uuid"[], "p_dueno_id" "uuid") IS 'Función corregida para auto-asignación que no depende del contexto RLS interno';



CREATE OR REPLACE FUNCTION "public"."cleanup_duplicate_invitations"("p_email" "text") RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_accepted_count integer;
    v_pending_count integer;
    v_deleted_count integer;
BEGIN
    -- Contar invitaciones existentes
    SELECT COUNT(*) INTO v_accepted_count
    FROM public.playero_invitacion 
    WHERE email = p_email AND estado = 'ACEPTADA';
    
    SELECT COUNT(*) INTO v_pending_count
    FROM public.playero_invitacion 
    WHERE email = p_email AND estado = 'PENDIENTE';
    
    -- Si hay invitaciones aceptadas, eliminar todas las pendientes
    IF v_accepted_count > 0 THEN
        DELETE FROM public.playero_invitacion 
        WHERE email = p_email AND estado = 'PENDIENTE';
        
        GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
        
        RETURN json_build_object(
            'success', true,
            'message', format('Eliminadas %s invitaciones pendientes duplicadas para %s', v_deleted_count, p_email),
            'accepted_invitations', v_accepted_count,
            'deleted_pending', v_deleted_count
        );
    END IF;
    
    -- Si hay múltiples invitaciones pendientes, mantener solo la más reciente
    IF v_pending_count > 1 THEN
        DELETE FROM public.playero_invitacion 
        WHERE email = p_email 
        AND estado = 'PENDIENTE'
        AND invitacion_id NOT IN (
            SELECT invitacion_id 
            FROM public.playero_invitacion 
            WHERE email = p_email AND estado = 'PENDIENTE'
            ORDER BY fecha_invitacion DESC 
            LIMIT 1
        );
        
        GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
        
        RETURN json_build_object(
            'success', true,
            'message', format('Eliminadas %s invitaciones pendientes duplicadas para %s', v_deleted_count, p_email),
            'pending_invitations_remaining', 1,
            'deleted_duplicates', v_deleted_count
        );
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'message', format('No hay invitaciones duplicadas para %s', p_email),
        'accepted_invitations', v_accepted_count,
        'pending_invitations', v_pending_count
    );
END;
$$;


ALTER FUNCTION "public"."cleanup_duplicate_invitations"("p_email" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."cleanup_duplicate_invitations"("p_email" "text") IS 'Limpia invitaciones duplicadas para un email específico. Si hay invitaciones aceptadas, elimina las pendientes. Si hay múltiples pendientes, mantiene solo la más reciente.';



CREATE OR REPLACE FUNCTION "public"."cleanup_orphaned_invitations"("p_dueno_id" "uuid" DEFAULT "auth"."uid"()) RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."cleanup_orphaned_invitations"("p_dueno_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."cleanup_orphaned_invitations"("p_dueno_id" "uuid") IS 'Limpia invitaciones ACEPTADAS que ya no tienen un playero activo correspondiente para el dueño especificado';



CREATE OR REPLACE FUNCTION "public"."cleanup_orphaned_user"("p_email" "text") RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_usuario_id uuid;
    v_auth_exists boolean;
    v_deleted_relations integer := 0;
    v_deleted_roles integer := 0;
    v_deleted_user integer := 0;  -- Cambiar a integer
BEGIN
    -- Buscar usuario en public.usuario
    SELECT usuario_id INTO v_usuario_id
    FROM public.usuario
    WHERE email = p_email;
    
    IF v_usuario_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Usuario no encontrado en public.usuario'
        );
    END IF;
    
    -- Verificar si existe en auth.users
    SELECT EXISTS (
        SELECT 1 FROM auth.users WHERE id = v_usuario_id
    ) INTO v_auth_exists;
    
    IF v_auth_exists THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Usuario existe en auth.users, no es huérfano'
        );
    END IF;
    
    -- Limpiar relaciones playero_playa
    DELETE FROM public.playero_playa 
    WHERE playero_id = v_usuario_id;
    GET DIAGNOSTICS v_deleted_relations = ROW_COUNT;
    
    -- Limpiar roles
    DELETE FROM public.rol_usuario 
    WHERE usuario_id = v_usuario_id;
    GET DIAGNOSTICS v_deleted_roles = ROW_COUNT;
    
    -- Eliminar usuario
    DELETE FROM public.usuario 
    WHERE usuario_id = v_usuario_id;
    GET DIAGNOSTICS v_deleted_user = ROW_COUNT;
    
    RETURN json_build_object(
        'success', true,
        'message', format('Usuario huérfano %s limpiado exitosamente', p_email),
        'deleted_relations', v_deleted_relations,
        'deleted_roles', v_deleted_roles,
        'deleted_user', v_deleted_user > 0
    );
END;
$$;


ALTER FUNCTION "public"."cleanup_orphaned_user"("p_email" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."cleanup_orphaned_user"("p_email" "text") IS 'Limpia un usuario específico que existe en public.usuario pero no en auth.users';



CREATE OR REPLACE FUNCTION "public"."crear_invitacion_playero"("p_email" "text", "p_nombre" "text" DEFAULT NULL::"text", "p_playas_ids" "uuid"[] DEFAULT ARRAY[]::"uuid"[], "p_dueno_id" "uuid" DEFAULT "auth"."uid"()) RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_invitacion_id uuid;
    v_usuario_id uuid;
    v_usuario_nombre text;
    v_usuario_existe boolean := false;
    v_dueno_nombre text;
    v_playas_nombres text[];
    v_ya_es_playero boolean := false;
    v_nombre_guardado text;
BEGIN
    IF p_dueno_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Usuario no autenticado'
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.rol_usuario 
        WHERE usuario_id = p_dueno_id AND rol = 'DUENO'
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Solo los dueños pueden invitar playeros'
        );
    END IF;

    IF p_playas_ids IS NULL OR array_length(p_playas_ids, 1) = 0 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Debe asignar al menos una playa'
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.playa
        WHERE playa_id = ANY(p_playas_ids)
        AND playa_dueno_id = p_dueno_id
        HAVING COUNT(*) = array_length(p_playas_ids, 1)
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Algunas playas no pertenecen al dueño'
        );
    END IF;

    SELECT id, raw_user_meta_data->>'name'
    INTO v_usuario_id, v_usuario_nombre
    FROM auth.users
    WHERE email = p_email;

    IF v_usuario_id IS NOT NULL THEN
        v_usuario_existe := true;

        SELECT EXISTS (
            SELECT 1 FROM public.playero_playa pp
            WHERE pp.playero_id = v_usuario_id
            AND pp.playa_id = ANY(p_playas_ids)
            AND pp.dueno_invitador_id = p_dueno_id
            AND pp.estado IN ('ACTIVO', 'SUSPENDIDO')
        ) INTO v_ya_es_playero;

        IF v_ya_es_playero THEN
            RETURN json_build_object(
                'success', false,
                'error', 'El usuario ya es playero de una o más de estas playas'
            );
        END IF;
    ELSE
        IF p_nombre IS NULL OR trim(p_nombre) = '' THEN
            RETURN json_build_object(
                'success', false,
                'error', 'El nombre es requerido para nuevos usuarios'
            );
        END IF;
    END IF;

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

    SELECT nombre INTO v_dueno_nombre
    FROM public.usuario
    WHERE usuario_id = p_dueno_id;

    SELECT array_agg(nombre) INTO v_playas_nombres
    FROM public.playa
    WHERE playa_id = ANY(p_playas_ids);

    v_nombre_guardado := COALESCE(v_usuario_nombre, p_nombre, 'Usuario');

    INSERT INTO public.playero_invitacion (
        email,
        nombre,
        dueno_invitador_id,
        playas_ids,
        estado,
        fecha_invitacion,
        fecha_expiracion
    ) VALUES (
        p_email,
        v_nombre_guardado,
        p_dueno_id,
        p_playas_ids,
        'PENDIENTE',
        now(),
        now() + interval '7 days'
    ) RETURNING invitacion_id INTO v_invitacion_id;

    RETURN json_build_object(
        'success', true,
        'invitacion_id', v_invitacion_id,
        'nombre', v_nombre_guardado,
        'message', format('Invitación creada para %s', p_email),
        'playas_nombres', v_playas_nombres,
        'dueno_nombre', v_dueno_nombre,
        'usuario_existe', v_usuario_existe,
        'requires_email', true
    );
END;
$$;


ALTER FUNCTION "public"."crear_invitacion_playero"("p_email" "text", "p_nombre" "text", "p_playas_ids" "uuid"[], "p_dueno_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."crear_invitacion_playero"("p_email" "text", "p_nombre" "text", "p_playas_ids" "uuid"[], "p_dueno_id" "uuid") IS 'Crea invitación para playero, detecta automáticamente si el usuario existe y retorna el nombre correcto';



CREATE OR REPLACE FUNCTION "public"."create_complete_playa_setup"("playa_data" "jsonb", "tipos_plaza_data" "jsonb", "modalidades_ocupacion_data" "jsonb", "metodos_pago_data" "jsonb", "plazas_data" "jsonb", "tarifas_data" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  new_playa_id UUID;
  tipo_plaza_ids INTEGER[];
  modalidad_ocupacion_ids INTEGER[];
  plaza_id INTEGER;
  tipo_plaza_record RECORD;
  modalidad_record RECORD;
  metodo_record RECORD;
  plaza_record RECORD;
  tarifa_record RECORD;
  i INTEGER;
BEGIN
  -- 1. Crear la playa
  INSERT INTO playas (
    descripcion, calle, numero, latitud, longitud, horario, estado
  ) VALUES (
    (playa_data->>'descripcion')::TEXT,
    (playa_data->>'calle')::TEXT,
    (playa_data->>'numero')::INTEGER,
    (playa_data->>'latitud')::DECIMAL,
    (playa_data->>'longitud')::DECIMAL,
    (playa_data->>'horario')::TEXT,
    'ACTIVO'
  ) RETURNING id INTO new_playa_id;

  -- 2. Crear tipos de plaza y almacenar sus IDs
  tipo_plaza_ids := ARRAY[]::INTEGER[];
  FOR tipo_plaza_record IN SELECT * FROM jsonb_array_elements(tipos_plaza_data)
  LOOP
    DECLARE
      new_tipo_plaza_id INTEGER;
      caracteristica_id INTEGER;
    BEGIN
      -- Crear el tipo de plaza
      INSERT INTO tipos_plaza (
        playa_id, nombre, descripcion, estado
      ) VALUES (
        new_playa_id,
        (tipo_plaza_record.value->>'nombre')::TEXT,
        (tipo_plaza_record.value->>'descripcion')::TEXT,
        'ACTIVO'
      ) RETURNING id INTO new_tipo_plaza_id;
      
      -- Agregar características al tipo de plaza
      FOR caracteristica_id IN SELECT jsonb_array_elements_text(tipo_plaza_record.value->'caracteristicas')::INTEGER
      LOOP
        INSERT INTO tipos_plaza_caracteristicas (tipo_plaza_id, caracteristica_id)
        VALUES (new_tipo_plaza_id, caracteristica_id);
      END LOOP;
      
      tipo_plaza_ids := array_append(tipo_plaza_ids, new_tipo_plaza_id);
    END;
  END LOOP;

  -- 3. Crear modalidades de ocupación y almacenar sus IDs
  modalidad_ocupacion_ids := ARRAY[]::INTEGER[];
  FOR modalidad_record IN SELECT * FROM jsonb_array_elements(modalidades_ocupacion_data)
  LOOP
    DECLARE
      new_modalidad_id INTEGER;
    BEGIN
      INSERT INTO modalidades_ocupacion (
        playa_id, modalidad_ocupacion, estado
      ) VALUES (
        new_playa_id,
        (modalidad_record.value->>'modalidad_ocupacion')::TEXT,
        'ACTIVO'
      ) RETURNING id INTO new_modalidad_id;
      
      modalidad_ocupacion_ids := array_append(modalidad_ocupacion_ids, new_modalidad_id);
    END;
  END LOOP;

  -- 4. Crear métodos de pago
  FOR metodo_record IN SELECT * FROM jsonb_array_elements(metodos_pago_data)
  LOOP
    INSERT INTO metodos_pago_playa (
      playa_id, metodo_pago, estado
    ) VALUES (
      new_playa_id,
      (metodo_record.value->>'metodo_pago')::TEXT,
      'ACTIVO'
    );
  END LOOP;

  -- 5. Crear plazas
  FOR plaza_record IN SELECT * FROM jsonb_array_elements(plazas_data)
  LOOP
    DECLARE
      tipo_plaza_index INTEGER;
      selected_tipo_plaza_id INTEGER;
      cantidad INTEGER;
      j INTEGER;
    BEGIN
      tipo_plaza_index := (plaza_record.value->>'tipo_plaza_index')::INTEGER;
      selected_tipo_plaza_id := tipo_plaza_ids[tipo_plaza_index + 1]; -- Arrays en PostgreSQL son 1-indexed
      cantidad := (plaza_record.value->>'cantidad')::INTEGER;
      
      -- Crear múltiples plazas según la cantidad especificada
      FOR j IN 1..cantidad LOOP
        INSERT INTO plazas (
          playa_id, tipo_plaza_id, identificador, estado
        ) VALUES (
          new_playa_id,
          selected_tipo_plaza_id,
          CASE 
            WHEN cantidad = 1 THEN (plaza_record.value->>'identificador')::TEXT
            ELSE COALESCE((plaza_record.value->>'identificador')::TEXT, '') || '-' || j::TEXT
          END,
          'ACTIVO'
        );
      END LOOP;
    END;
  END LOOP;

  -- 6. Crear tarifas
  FOR tarifa_record IN SELECT * FROM jsonb_array_elements(tarifas_data)
  LOOP
    DECLARE
      tipo_plaza_index INTEGER;
      modalidad_index INTEGER;
      selected_tipo_plaza_id INTEGER;
      selected_modalidad_id INTEGER;
    BEGIN
      tipo_plaza_index := (tarifa_record.value->>'tipo_plaza_index')::INTEGER;
      modalidad_index := (tarifa_record.value->>'modalidad_ocupacion_index')::INTEGER;
      selected_tipo_plaza_id := tipo_plaza_ids[tipo_plaza_index + 1];
      selected_modalidad_id := modalidad_ocupacion_ids[modalidad_index + 1];
      
      INSERT INTO tarifas (
        playa_id, tipo_plaza_id, modalidad_ocupacion_id, tipo_vehiculo, precio_base, estado
      ) VALUES (
        new_playa_id,
        selected_tipo_plaza_id,
        selected_modalidad_id,
        (tarifa_record.value->>'tipo_vehiculo')::TEXT,
        (tarifa_record.value->>'precio_base')::DECIMAL,
        'ACTIVO'
      );
    END;
  END LOOP;

  -- Retornar el ID de la playa creada
  RETURN jsonb_build_object('playa_id', new_playa_id);

EXCEPTION
  WHEN OTHERS THEN
    -- En caso de error, la transacción se revierte automáticamente
    RAISE EXCEPTION 'Error al crear configuración completa: %', SQLERRM;
END;
$$;


ALTER FUNCTION "public"."create_complete_playa_setup"("playa_data" "jsonb", "tipos_plaza_data" "jsonb", "modalidades_ocupacion_data" "jsonb", "metodos_pago_data" "jsonb", "plazas_data" "jsonb", "tarifas_data" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_complete_playa_setup"("playa_data" "jsonb", "tipos_plaza_data" "jsonb", "modalidades_ocupacion_data" "jsonb", "metodos_pago_data" "jsonb", "plazas_data" "jsonb", "tarifas_data" "jsonb", "tipos_vehiculo_data" "jsonb" DEFAULT '[]'::"jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  new_playa_id UUID;
  current_user_id UUID;
  ciudad_id_value UUID;
  tipo_plaza_ids BIGINT[];
  tipo_plaza_record RECORD;
  modalidad_record RECORD;
  metodo_record RECORD;
  plaza_record RECORD;
  tarifa_record RECORD;
  tipo_vehiculo_record RECORD;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

  -- Buscar o crear la ciudad
  SELECT ciudad_id INTO ciudad_id_value
  FROM ciudad 
  WHERE nombre = (playa_data->>'ciudad')::TEXT 
    AND provincia = (playa_data->>'provincia')::TEXT;
  
  IF ciudad_id_value IS NULL THEN
    INSERT INTO ciudad (nombre, provincia)
    VALUES (
      (playa_data->>'ciudad')::TEXT,
      (playa_data->>'provincia')::TEXT
    )
    RETURNING ciudad_id INTO ciudad_id_value;
  END IF;

  -- Crear la playa
  INSERT INTO playa (
    playa_dueno_id, nombre, descripcion, direccion, ciudad_id, latitud, longitud, horario, estado
  ) VALUES (
    current_user_id,
    (playa_data->>'nombre')::TEXT,
    (playa_data->>'descripcion')::TEXT,
    (playa_data->>'direccion')::TEXT,
    ciudad_id_value,
    (playa_data->>'latitud')::DOUBLE PRECISION,
    (playa_data->>'longitud')::DOUBLE PRECISION,
    (playa_data->>'horario')::TEXT,
    'BORRADOR'::playa_estado
  ) RETURNING playa_id INTO new_playa_id;

  -- Crear tipos de plaza y almacenar sus IDs
  tipo_plaza_ids := ARRAY[]::BIGINT[];
  FOR tipo_plaza_record IN SELECT * FROM jsonb_array_elements(tipos_plaza_data)
  LOOP
    DECLARE
      new_tipo_plaza_id BIGINT;
      caracteristica_id BIGINT;
    BEGIN
      INSERT INTO tipo_plaza (
        playa_id, nombre, descripcion
      ) VALUES (
        new_playa_id,
        (tipo_plaza_record.value->>'nombre')::TEXT,
        (tipo_plaza_record.value->>'descripcion')::TEXT
      ) RETURNING tipo_plaza_id INTO new_tipo_plaza_id;
      
      FOR caracteristica_id IN SELECT jsonb_array_elements_text(tipo_plaza_record.value->'caracteristicas')::BIGINT
      LOOP
        INSERT INTO tipo_plaza_caracteristica (playa_id, tipo_plaza_id, caracteristica_id)
        VALUES (new_playa_id, new_tipo_plaza_id, caracteristica_id);
      END LOOP;
      
      tipo_plaza_ids := array_append(tipo_plaza_ids, new_tipo_plaza_id);
    END;
  END LOOP;

  -- Crear modalidades de ocupación
  FOR modalidad_record IN SELECT * FROM jsonb_array_elements(modalidades_ocupacion_data)
  LOOP
    INSERT INTO modalidad_ocupacion_playa (
      playa_id, modalidad_ocupacion, estado
    ) VALUES (
      new_playa_id,
      (modalidad_record.value->>'modalidad_ocupacion')::modalidad_ocupacion,
      'ACTIVO'::modalidad_ocupacion_playa_estado
    );
  END LOOP;

  -- Crear tipos de vehículo habilitados
  FOR tipo_vehiculo_record IN SELECT * FROM jsonb_array_elements_text(tipos_vehiculo_data)
  LOOP
    INSERT INTO tipo_vehiculo_playa (
      playa_id, tipo_vehiculo, estado
    ) VALUES (
      new_playa_id,
      tipo_vehiculo_record.value::tipo_vehiculo,
      'ACTIVO'::tipo_vehiculo_estado
    );
  END LOOP;

  -- Crear métodos de pago
  FOR metodo_record IN SELECT * FROM jsonb_array_elements(metodos_pago_data)
  LOOP
    INSERT INTO metodo_pago_playa (
      playa_id, metodo_pago, estado
    ) VALUES (
      new_playa_id,
      (metodo_record.value->>'metodo_pago')::metodo_pago,
      'ACTIVO'::metodo_pago_estado
    );
  END LOOP;

  -- Crear plazas individuales
  FOR plaza_record IN SELECT * FROM jsonb_array_elements(plazas_data)
  LOOP
    DECLARE
      tipo_plaza_index INTEGER;
      selected_tipo_plaza_id BIGINT;
    BEGIN
      tipo_plaza_index := (plaza_record.value->>'tipo_plaza_index')::INTEGER;
      selected_tipo_plaza_id := tipo_plaza_ids[tipo_plaza_index + 1];
      
      INSERT INTO plaza (
        playa_id, tipo_plaza_id, identificador, estado
      ) VALUES (
        new_playa_id,
        selected_tipo_plaza_id,
        (plaza_record.value->>'identificador')::TEXT,
        'ACTIVO'::plaza_estado
      );
    END;
  END LOOP;

  -- Crear tarifas
  FOR tarifa_record IN SELECT * FROM jsonb_array_elements(tarifas_data)
  LOOP
    DECLARE
      tipo_plaza_index INTEGER;
      selected_tipo_plaza_id BIGINT;
    BEGIN
      tipo_plaza_index := (tarifa_record.value->>'tipo_plaza_index')::INTEGER;
      selected_tipo_plaza_id := tipo_plaza_ids[tipo_plaza_index + 1];
      
      INSERT INTO tarifa (
        playa_id, tipo_plaza_id, modalidad_ocupacion, tipo_vehiculo, precio_base
      ) VALUES (
        new_playa_id,
        selected_tipo_plaza_id,
        (tarifa_record.value->>'modalidad_ocupacion')::modalidad_ocupacion,
        (tarifa_record.value->>'tipo_vehiculo')::tipo_vehiculo,
        (tarifa_record.value->>'precio_base')::REAL
      );
    END;
  END LOOP;

  RETURN jsonb_build_object('playa_id', new_playa_id);

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error al crear configuración completa: %', SQLERRM;
END;
$$;


ALTER FUNCTION "public"."create_complete_playa_setup"("playa_data" "jsonb", "tipos_plaza_data" "jsonb", "modalidades_ocupacion_data" "jsonb", "metodos_pago_data" "jsonb", "plazas_data" "jsonb", "tarifas_data" "jsonb", "tipos_vehiculo_data" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_tipo_plaza_with_caracteristicas"("p_playa_id" "uuid", "p_nombre" "text", "p_descripcion" "text" DEFAULT ''::"text", "p_caracteristicas" bigint[] DEFAULT ARRAY[]::bigint[]) RETURNS TABLE("tipo_plaza_id" bigint, "playa_id" "uuid", "nombre" "text", "descripcion" "text", "fecha_creacion" timestamp with time zone, "fecha_modificacion" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "row_security" TO 'off'
    AS $$
DECLARE
  v_tipo_plaza_id bigint;
  v_caracteristica_id bigint;
  v_existing_caracteristicas bigint[];
  v_existing_tipo_plaza_id bigint;
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM playa pl 
    WHERE pl.playa_id = p_playa_id 
      AND pl.playa_dueno_id = auth.uid() 
      AND pl.fecha_eliminacion IS NULL
  ) THEN
    RAISE EXCEPTION 'La playa con ID % no existe o no tienes permisos', p_playa_id;
  END IF;

  IF EXISTS (
    SELECT 1 
    FROM tipo_plaza tp 
    WHERE tp.playa_id = p_playa_id 
      AND LOWER(tp.nombre) = LOWER(p_nombre)
      AND tp.fecha_eliminacion IS NULL
  ) THEN
    RAISE EXCEPTION 'Ya existe un tipo de plaza con el nombre "%"', p_nombre;
  END IF;

  IF array_length(p_caracteristicas, 1) > 0 THEN
    FOREACH v_caracteristica_id IN ARRAY p_caracteristicas
    LOOP
      IF NOT EXISTS (SELECT 1 FROM caracteristica car WHERE car.caracteristica_id = v_caracteristica_id) THEN
        RAISE EXCEPTION 'La característica con ID % no existe', v_caracteristica_id;
      END IF;
    END LOOP;

    FOR v_existing_tipo_plaza_id IN 
      SELECT tp.tipo_plaza_id
      FROM tipo_plaza tp
      WHERE tp.playa_id = p_playa_id 
        AND tp.fecha_eliminacion IS NULL
    LOOP
      SELECT ARRAY(
        SELECT tpc.caracteristica_id 
        FROM tipo_plaza_caracteristica tpc 
        WHERE tpc.playa_id = p_playa_id 
          AND tpc.tipo_plaza_id = v_existing_tipo_plaza_id
        ORDER BY tpc.caracteristica_id
      ) INTO v_existing_caracteristicas;
      
      IF (SELECT ARRAY(SELECT unnest(p_caracteristicas) ORDER BY 1)) = 
         (SELECT ARRAY(SELECT unnest(v_existing_caracteristicas) ORDER BY 1)) THEN
        RAISE EXCEPTION 'Ya existe un tipo de plaza con las mismas características';
      END IF;
    END LOOP;
  ELSE
    IF EXISTS (
      SELECT 1 
      FROM tipo_plaza tp 
      WHERE tp.playa_id = p_playa_id 
        AND tp.fecha_eliminacion IS NULL
        AND NOT EXISTS (
          SELECT 1 
          FROM tipo_plaza_caracteristica tpc 
          WHERE tpc.playa_id = p_playa_id 
            AND tpc.tipo_plaza_id = tp.tipo_plaza_id
        )
    ) THEN
      RAISE EXCEPTION 'Ya existe un tipo de plaza sin características';
    END IF;
  END IF;

  INSERT INTO tipo_plaza (playa_id, nombre, descripcion)
  VALUES (p_playa_id, p_nombre, p_descripcion)
  RETURNING tipo_plaza.tipo_plaza_id INTO v_tipo_plaza_id;
  
  IF v_tipo_plaza_id IS NULL THEN
    RAISE EXCEPTION 'Error al crear el tipo de plaza';
  END IF;
  
  IF array_length(p_caracteristicas, 1) > 0 THEN
    FOREACH v_caracteristica_id IN ARRAY p_caracteristicas
    LOOP
      INSERT INTO tipo_plaza_caracteristica (playa_id, tipo_plaza_id, caracteristica_id)
      VALUES (p_playa_id, v_tipo_plaza_id, v_caracteristica_id);
    END LOOP;
  END IF;
  
  RETURN QUERY
  SELECT 
    tp.tipo_plaza_id,
    tp.playa_id,
    tp.nombre,
    tp.descripcion,
    tp.fecha_creacion,
    tp.fecha_modificacion
  FROM tipo_plaza tp
  WHERE tp.tipo_plaza_id = v_tipo_plaza_id AND tp.playa_id = p_playa_id;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error al crear tipo de plaza: %', SQLERRM;
END;
$$;


ALTER FUNCTION "public"."create_tipo_plaza_with_caracteristicas"("p_playa_id" "uuid", "p_nombre" "text", "p_descripcion" "text", "p_caracteristicas" bigint[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_playa"("playa_id_param" "uuid") RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    has_related_records BOOLEAN := FALSE;
    result JSON;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM playa 
        WHERE playa_id = playa_id_param 
        AND fecha_eliminacion IS NULL
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Playa no encontrada o ya eliminada'
        );
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM plaza 
        WHERE playa_id = playa_id_param 
        AND fecha_eliminacion IS NULL
    ) INTO has_related_records;

    IF NOT has_related_records THEN
        SELECT EXISTS (
            SELECT 1 FROM tipo_plaza 
            WHERE playa_id = playa_id_param 
            AND fecha_eliminacion IS NULL
        ) INTO has_related_records;
    END IF;

    IF NOT has_related_records THEN
        SELECT EXISTS (
            SELECT 1 FROM metodo_pago_playa 
            WHERE playa_id = playa_id_param 
            AND fecha_eliminacion IS NULL
        ) INTO has_related_records;
    END IF;

    IF NOT has_related_records THEN
        SELECT EXISTS (
            SELECT 1 FROM modalidad_ocupacion_playa 
            WHERE playa_id = playa_id_param 
            AND fecha_eliminacion IS NULL
        ) INTO has_related_records;
    END IF;

    IF NOT has_related_records THEN
        SELECT EXISTS (
            SELECT 1 FROM tipo_vehiculo_playa 
            WHERE playa_id = playa_id_param
        ) INTO has_related_records;
    END IF;

    IF NOT has_related_records THEN
        SELECT EXISTS (
            SELECT 1 FROM tarifa 
            WHERE playa_id = playa_id_param
        ) INTO has_related_records;
    END IF;

    IF has_related_records THEN
        UPDATE playa 
        SET 
            estado = 'SUSPENDIDO',
            fecha_eliminacion = NOW()
        WHERE playa_id = playa_id_param;

        result := json_build_object(
            'success', true,
            'action', 'soft_delete',
            'message', 'Playa suspendida debido a registros relacionados'
        );
    ELSE
        DELETE FROM playa WHERE playa_id = playa_id_param;

        result := json_build_object(
            'success', true,
            'action', 'hard_delete',
            'message', 'Playa eliminada completamente'
        );
    END IF;

    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;


ALTER FUNCTION "public"."delete_playa"("playa_id_param" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_plaza"("plaza_id_param" "uuid") RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    plaza_exists BOOLEAN := FALSE;
    has_dependencies BOOLEAN := FALSE;
    result JSON;
BEGIN
    -- Verificar si la plaza existe y no está ya eliminada
    SELECT EXISTS(
        SELECT 1 FROM plaza 
        WHERE plaza_id = plaza_id_param 
        AND fecha_eliminacion IS NULL
    ) INTO plaza_exists;
    
    IF NOT plaza_exists THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Plaza no encontrada o ya eliminada'
        );
    END IF;
    
    -- Verificar si tiene dependencias reales (ocupaciones, turnos, reservas, etc.)
    -- Por ahora no hay tablas de ocupaciones/turnos implementadas, 
    -- por lo que siempre será eliminación física
    -- En el futuro agregar verificaciones como:
    -- SELECT EXISTS(SELECT 1 FROM ocupaciones WHERE plaza_id = plaza_id_param) 
    -- OR EXISTS(SELECT 1 FROM turnos WHERE plaza_id = plaza_id_param)
    -- OR EXISTS(SELECT 1 FROM reservas WHERE plaza_id = plaza_id_param)
    
    has_dependencies := FALSE;
    
    -- Si no tiene dependencias críticas, eliminación física
    IF NOT has_dependencies THEN
        DELETE FROM plaza WHERE plaza_id = plaza_id_param;
        
        RETURN json_build_object(
            'success', true,
            'message', 'Plaza eliminada completamente',
            'deletion_type', 'physical'
        );
    ELSE
        -- Si tiene dependencias, baja lógica
        UPDATE plaza 
        SET 
            estado = 'SUSPENDIDO',
            fecha_eliminacion = NOW(),
            fecha_modificacion = NOW()
        WHERE plaza_id = plaza_id_param;
        
        RETURN json_build_object(
            'success', true,
            'message', 'Plaza suspendida (baja lógica debido a dependencias)',
            'deletion_type', 'logical'
        );
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Error interno: ' || SQLERRM
        );
END;
$$;


ALTER FUNCTION "public"."delete_plaza"("plaza_id_param" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_tarifa"("p_playa_id" "uuid", "p_tipo_plaza_id" bigint, "p_modalidad_ocupacion" "public"."modalidad_ocupacion", "p_tipo_vehiculo" "public"."tipo_vehiculo") RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_result JSON;
BEGIN
  -- Eliminar la tarifa directamente
  DELETE FROM tarifa 
  WHERE playa_id = p_playa_id 
    AND tipo_plaza_id = p_tipo_plaza_id 
    AND modalidad_ocupacion = p_modalidad_ocupacion 
    AND tipo_vehiculo = p_tipo_vehiculo;

  -- Verificar si se eliminó alguna fila
  IF FOUND THEN
    v_result := json_build_object(
      'success', true,
      'message', 'Tarifa eliminada correctamente'
    );
  ELSE
    v_result := json_build_object(
      'success', false,
      'error', 'No se encontró la tarifa especificada'
    );
  END IF;

  RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."delete_tarifa"("p_playa_id" "uuid", "p_tipo_plaza_id" bigint, "p_modalidad_ocupacion" "public"."modalidad_ocupacion", "p_tipo_vehiculo" "public"."tipo_vehiculo") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_tipo_plaza"("p_tipo_plaza_id" bigint, "p_playa_id" "uuid") RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_tarifa_count INTEGER;
  v_plaza_count INTEGER;
  v_result JSON;
BEGIN
  -- Verificar que el tipo de plaza existe y no está eliminado
  IF NOT EXISTS (
    SELECT 1 FROM tipo_plaza 
    WHERE tipo_plaza_id = p_tipo_plaza_id 
      AND playa_id = p_playa_id 
      AND fecha_eliminacion IS NULL
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Tipo de plaza no encontrado o ya eliminado'
    );
  END IF;

  -- Verificar si el tipo de plaza está siendo usado en tarifas
  SELECT COUNT(*) INTO v_tarifa_count
  FROM tarifa 
  WHERE tipo_plaza_id = p_tipo_plaza_id 
    AND playa_id = p_playa_id;

  -- Verificar si el tipo de plaza está siendo usado en plazas
  SELECT COUNT(*) INTO v_plaza_count
  FROM plaza 
  WHERE tipo_plaza_id = p_tipo_plaza_id 
    AND playa_id = p_playa_id 
    AND fecha_eliminacion IS NULL;

  -- Si está siendo usado, hacer soft delete
  IF v_tarifa_count > 0 OR v_plaza_count > 0 THEN
    UPDATE tipo_plaza 
    SET 
      fecha_eliminacion = NOW(),
      fecha_modificacion = NOW()
    WHERE tipo_plaza_id = p_tipo_plaza_id 
      AND playa_id = p_playa_id;

    v_result := json_build_object(
      'success', true,
      'type', 'soft_delete',
      'message', 'Tipo de plaza marcado como eliminado (soft delete) porque está siendo usado en tarifas o plazas'
    );
  ELSE
    -- Si no está siendo usado, eliminar completamente
    -- Primero eliminar las características asociadas
    DELETE FROM tipo_plaza_caracteristica 
    WHERE tipo_plaza_id = p_tipo_plaza_id 
      AND playa_id = p_playa_id;

    -- Luego eliminar el tipo de plaza
    DELETE FROM tipo_plaza 
    WHERE tipo_plaza_id = p_tipo_plaza_id 
      AND playa_id = p_playa_id;

    v_result := json_build_object(
      'success', true,
      'type', 'hard_delete',
      'message', 'Tipo de plaza eliminado completamente junto con sus características'
    );
  END IF;

  RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."delete_tipo_plaza"("p_tipo_plaza_id" bigint, "p_playa_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."desvincular_playero_de_playas"("p_playero_id" "uuid", "p_playas_ids" "uuid"[], "p_motivo" "text" DEFAULT 'Desvinculado por el dueño'::"text") RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_dueno_id uuid := auth.uid();
    v_playas_validas uuid[];
    v_total_desvinculadas integer := 0;
    v_total_relaciones_restantes integer := 0;
    v_rol_eliminado boolean := false;
BEGIN
    SELECT array_agg(p.playa_id) INTO v_playas_validas
    FROM public.playa p
    WHERE p.playa_id = ANY(p_playas_ids)
    AND p.playa_dueno_id = v_dueno_id;
    
    IF v_playas_validas IS NULL OR array_length(v_playas_validas, 1) = 0 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'No tienes permisos sobre estas playas'
        );
    END IF;
    
    DELETE FROM public.playero_playa 
    WHERE playero_id = p_playero_id 
    AND playa_id = ANY(v_playas_validas)
    AND dueno_invitador_id = v_dueno_id;
    
    GET DIAGNOSTICS v_total_desvinculadas = ROW_COUNT;
    
    SELECT COUNT(*) INTO v_total_relaciones_restantes
    FROM public.playero_playa pp
    WHERE pp.playero_id = p_playero_id 
    AND pp.estado IN ('ACTIVO', 'SUSPENDIDO');
    
    IF v_total_relaciones_restantes = 0 THEN
        DELETE FROM public.rol_usuario 
        WHERE usuario_id = p_playero_id AND rol = 'PLAYERO';
        v_rol_eliminado := true;
    END IF;
    
    DELETE FROM public.playero_invitacion 
    WHERE dueno_invitador_id = v_dueno_id
    AND auth_user_id = p_playero_id
    AND estado IN ('PENDIENTE', 'EXPIRADA');
    
    RETURN json_build_object(
        'success', true,
        'playas_desvinculadas', v_total_desvinculadas,
        'relaciones_restantes', v_total_relaciones_restantes,
        'rol_eliminado', v_rol_eliminado,
        'message', format('Playero desvinculado de %s playa(s)', v_total_desvinculadas)
    );
END;
$$;


ALTER FUNCTION "public"."desvincular_playero_de_playas"("p_playero_id" "uuid", "p_playas_ids" "uuid"[], "p_motivo" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."desvincular_playero_de_playas"("p_playero_id" "uuid", "p_playas_ids" "uuid"[], "p_motivo" "text") IS 'Desvincula playero de playas específicas, no lo elimina completamente';



CREATE OR REPLACE FUNCTION "public"."eliminar_invitacion_pendiente"("p_email" "text", "p_dueno_id" "uuid" DEFAULT "auth"."uid"()) RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_invitacion record;
    v_result json;
BEGIN
    -- Verificar que existe una invitación pendiente del dueño actual
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
            'error', 'Invitación no encontrada o ya expirada'
        );
    END IF;
    
    -- Marcar invitación como expirada (no eliminar físicamente para mantener historial)
    UPDATE public.playero_invitacion 
    SET estado = 'EXPIRADA',
        fecha_expiracion = now()
    WHERE invitacion_id = v_invitacion.invitacion_id;
    
    RETURN json_build_object(
        'success', true,
        'message', format('Invitación a %s eliminada correctamente', p_email)
    );
END;
$$;


ALTER FUNCTION "public"."eliminar_invitacion_pendiente"("p_email" "text", "p_dueno_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."eliminar_invitacion_playero"("p_email" "text", "p_dueno_id" "uuid" DEFAULT "auth"."uid"()) RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_invitacion_id uuid;
    v_affected_rows integer;
BEGIN
    -- Verificar que el dueño tiene permisos
    IF NOT EXISTS (
        SELECT 1 FROM public.rol_usuario 
        WHERE usuario_id = p_dueno_id AND rol = 'DUENO'
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Solo los dueños pueden eliminar invitaciones'
        );
    END IF;
    
    -- Buscar invitación pendiente
    SELECT invitacion_id INTO v_invitacion_id
    FROM public.playero_invitacion 
    WHERE email = p_email 
    AND dueno_invitador_id = p_dueno_id
    AND estado = 'PENDIENTE'
    AND fecha_expiracion > now();
    
    IF v_invitacion_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'No se encontró una invitación pendiente para este email'
        );
    END IF;
    
    -- Eliminar la invitación
    DELETE FROM public.playero_invitacion 
    WHERE invitacion_id = v_invitacion_id;
    
    GET DIAGNOSTICS v_affected_rows = ROW_COUNT;
    
    -- También eliminar el usuario de auth si existe y no tiene otras relaciones
    -- (esto es opcional, podríamos dejarlo para que pueda registrarse después)
    
    RETURN json_build_object(
        'success', true,
        'message', format('Invitación eliminada para %s', p_email)
    );
END;
$$;


ALTER FUNCTION "public"."eliminar_invitacion_playero"("p_email" "text", "p_dueno_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."eliminar_invitacion_playero"("p_email" "text", "p_dueno_id" "uuid") IS 'Permite al dueño eliminar una invitación pendiente';



CREATE OR REPLACE FUNCTION "public"."eliminar_playero"("p_playero_id" "uuid", "p_playa_id" "uuid", "p_motivo" "text" DEFAULT 'Eliminado por el dueño'::"text") RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_dueno_id uuid;
    v_playero_email text;
    v_playero_nombre text;
    v_es_referenciado boolean := false;
    v_playas_del_dueno uuid[];
    v_total_relaciones_usuario integer := 0;
    v_invitaciones_eliminadas integer := 0;
    v_usuario_eliminado boolean := false;
    v_result json;
BEGIN
    SELECT playa_dueno_id INTO v_dueno_id
    FROM public.playa 
    WHERE playa_id = p_playa_id;
    
    IF v_dueno_id != auth.uid() THEN
        RETURN json_build_object(
            'success', false,
            'error', 'No tienes permisos para eliminar playeros de esta playa'
        );
    END IF;
    
    SELECT u.email, u.nombre INTO v_playero_email, v_playero_nombre
    FROM public.usuario u
    WHERE u.usuario_id = p_playero_id;
    
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
    
    DELETE FROM public.playero_invitacion 
    WHERE email = v_playero_email 
    AND dueno_invitador_id = v_dueno_id;
    
    GET DIAGNOSTICS v_invitaciones_eliminadas = ROW_COUNT;
    
    IF v_es_referenciado THEN
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
        DELETE FROM public.playero_playa 
        WHERE playero_id = p_playero_id 
        AND playa_id = ANY(v_playas_del_dueno);
        
        SELECT COUNT(*) INTO v_total_relaciones_usuario
        FROM public.playero_playa pp
        WHERE pp.playero_id = p_playero_id 
        AND pp.estado IN ('ACTIVO', 'SUSPENDIDO');
        
        IF v_total_relaciones_usuario = 0 THEN
            DELETE FROM public.rol_usuario 
            WHERE usuario_id = p_playero_id AND rol = 'PLAYERO';
            
            DELETE FROM public.usuario
            WHERE usuario_id = p_playero_id;
            
            DELETE FROM auth.users
            WHERE id = p_playero_id;
            
            v_usuario_eliminado := true;
            
            v_result := json_build_object(
                'success', true,
                'action', 'deleted',
                'role_removed', true,
                'user_deleted', true,
                'affected_playas', array_length(v_playas_del_dueno, 1),
                'invitations_deleted', v_invitaciones_eliminadas,
                'message', format('Playero %s eliminado completamente del sistema', v_playero_nombre)
            );
        ELSE
            v_result := json_build_object(
                'success', true,
                'action', 'deleted',
                'role_removed', false,
                'user_deleted', false,
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


ALTER FUNCTION "public"."eliminar_playero"("p_playero_id" "uuid", "p_playa_id" "uuid", "p_motivo" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."eliminar_playero"("p_playero_id" "uuid", "p_playa_id" "uuid", "p_motivo" "text") IS 'Elimina playero y si no tiene más relaciones, elimina completamente de auth.users y usuario';



CREATE OR REPLACE FUNCTION "public"."es_playero_de_playa"("p_usuario_id" "uuid", "p_playa_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."es_playero_de_playa"("p_usuario_id" "uuid", "p_playa_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."es_playero_de_playa"("p_usuario_id" "uuid", "p_playa_id" "uuid") IS 'Verifica si un usuario es playero activo de una playa específica';



CREATE OR REPLACE FUNCTION "public"."find_orphaned_invitations"("p_dueno_id" "uuid" DEFAULT "auth"."uid"()) RETURNS TABLE("invitacion_id" "uuid", "email" "text", "estado" "text", "fecha_aceptacion" timestamp with time zone, "playas_ids" "uuid"[])
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."find_orphaned_invitations"("p_dueno_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."find_orphaned_invitations"("p_dueno_id" "uuid") IS 'Encuentra invitaciones huérfanas (ACEPTADAS sin playero activo) para el dueño especificado';



CREATE OR REPLACE FUNCTION "public"."find_orphaned_users"() RETURNS TABLE("usuario_id" "uuid", "email" "text", "nombre" "text", "has_auth_user" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.usuario_id,
        u.email,
        u.nombre,
        EXISTS(SELECT 1 FROM auth.users au WHERE au.id = u.usuario_id) as has_auth_user
    FROM public.usuario u
    WHERE NOT EXISTS(SELECT 1 FROM auth.users au WHERE au.id = u.usuario_id);
END;
$$;


ALTER FUNCTION "public"."find_orphaned_users"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."find_orphaned_users"() IS 'Encuentra todos los usuarios huérfanos en el sistema';



CREATE OR REPLACE FUNCTION "public"."fix_existing_playero_to_pending"("p_playero_email" "text", "p_dueno_id" "uuid" DEFAULT "auth"."uid"()) RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_playero_id uuid;
    v_affected_rows integer;
BEGIN
    -- Buscar el ID del playero por email
    SELECT usuario_id INTO v_playero_id
    FROM public.usuario 
    WHERE email = p_playero_email;
    
    IF v_playero_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Usuario no encontrado'
        );
    END IF;
    
    -- Cambiar estado a PENDIENTE
    UPDATE public.playero_playa 
    SET estado = 'PENDIENTE', 
        fecha_alta = null,
        fecha_modificacion = now()
    WHERE playero_id = v_playero_id
    AND dueno_invitador_id = p_dueno_id;
    
    GET DIAGNOSTICS v_affected_rows = ROW_COUNT;
    
    RETURN json_build_object(
        'success', true,
        'updated_rows', v_affected_rows,
        'message', format('Se actualizaron %s relaciones a estado PENDIENTE para %s', v_affected_rows, p_playero_email)
    );
END;
$$;


ALTER FUNCTION "public"."fix_existing_playero_to_pending"("p_playero_email" "text", "p_dueno_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_authenticated_user_with_roles"() RETURNS TABLE("usuario_id" "uuid", "email" "text", "nombre" "text", "telefono" "text", "roles" "public"."rol"[])
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
  SELECT 
    v.usuario_id,
    v.email,
    v.nombre,
    v.telefono,
    v.roles
  FROM v_user_with_roles v
  WHERE v.usuario_id = auth.uid();
$$;


ALTER FUNCTION "public"."get_authenticated_user_with_roles"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_authenticated_user_with_roles"() IS 'Función optimizada que retorna el usuario autenticado con sus roles en una sola query, reemplazando las 2 queries separadas de auth.getUser() + rol_usuario.';



CREATE OR REPLACE FUNCTION "public"."get_playa_filters"("search_query" "text" DEFAULT NULL::"text", "applied_filters" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  result JSON;
  estados_array JSON;
  ciudades_array JSON;
  where_conditions TEXT[];
  final_where TEXT;
BEGIN
  where_conditions := ARRAY['p.fecha_eliminacion IS NULL'];
  
  IF search_query IS NOT NULL AND search_query != '' THEN
    where_conditions := array_append(where_conditions, 
      format('(p.descripcion ILIKE %L OR p.direccion ILIKE %L OR p.nombre ILIKE %L)', 
        '%' || search_query || '%', 
        '%' || search_query || '%',
        '%' || search_query || '%'
      )
    );
  END IF;
  
  IF applied_filters ? 'estado' AND jsonb_array_length(applied_filters->'estado') > 0 THEN
    where_conditions := array_append(where_conditions,
      format('p.estado = ANY(ARRAY[%s]::playa_estado[])',
        (
          SELECT string_agg(quote_literal(value::text), ',')
          FROM jsonb_array_elements_text(applied_filters->'estado') AS value
        )
      )
    );
  END IF;
  
  IF applied_filters ? 'ciudad' AND jsonb_array_length(applied_filters->'ciudad') > 0 THEN
    where_conditions := array_append(where_conditions,
      format('p.ciudad_id = ANY(ARRAY[%s]::uuid[])',
        (
          SELECT string_agg(quote_literal(value::text), ',')
          FROM jsonb_array_elements_text(applied_filters->'ciudad') AS value
        )
      )
    );
  END IF;
  
  final_where := array_to_string(where_conditions, ' AND ');
  
  EXECUTE format('
    WITH filtered_playas AS (
      SELECT DISTINCT p.estado
      FROM playa p
      JOIN ciudad c ON p.ciudad_id = c.ciudad_id
      WHERE %s
    ),
    estados_with_labels AS (
      SELECT 
        estado::text as value,
        CASE 
          WHEN estado = ''BORRADOR'' THEN ''Borrador''
          WHEN estado = ''ACTIVO'' THEN ''Activo''
          WHEN estado = ''SUSPENDIDO'' THEN ''Suspendido''
          ELSE estado::text
        END as label
      FROM filtered_playas
      ORDER BY estado
    )
    SELECT COALESCE(json_agg(
      json_build_object(
        ''value'', value,
        ''label'', label
      )
    ), ''[]''::json)
    FROM estados_with_labels
  ', final_where) INTO estados_array;

  EXECUTE format('
    WITH filtered_ciudades AS (
      SELECT DISTINCT c.ciudad_id, c.nombre, c.provincia
      FROM playa p
      JOIN ciudad c ON p.ciudad_id = c.ciudad_id
      WHERE %s
    ),
    ciudades_with_labels AS (
      SELECT 
        ciudad_id::text as value,
        nombre || '', '' || provincia as label
      FROM filtered_ciudades
      ORDER BY nombre, provincia
    )
    SELECT COALESCE(json_agg(
      json_build_object(
        ''value'', value,
        ''label'', label
      )
    ), ''[]''::json)
    FROM ciudades_with_labels
  ', final_where) INTO ciudades_array;

  SELECT json_build_object(
    'estado', json_build_object(
      'title', 'Estado',
      'options', estados_array,
      'pagination', false
    ),
    'ciudad', json_build_object(
      'title', 'Ciudad',
      'options', ciudades_array,
      'pagination', false
    )
  ) INTO result;

  RETURN result;
END;
$$;


ALTER FUNCTION "public"."get_playa_filters"("search_query" "text", "applied_filters" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_playeros_for_dueno"("p_dueno_id" "uuid" DEFAULT "auth"."uid"(), "p_search_query" "text" DEFAULT NULL::"text", "p_limit" integer DEFAULT 50, "p_offset" integer DEFAULT 0) RETURNS TABLE("playero_id" "uuid", "dueno_invitador_id" "uuid", "usuario_id" "uuid", "email" "text", "nombre" "text", "telefono" "text", "tipo_registro" "text", "estado" "text", "fecha_alta" timestamp with time zone, "fecha_baja" timestamp with time zone, "motivo_baja" "text", "fecha_creacion" timestamp with time zone, "fecha_modificacion" timestamp with time zone, "playas_asignadas" "json", "total_playas" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    WITH playeros_registrados AS (
        SELECT 
            pp.playero_id,
            pp.dueno_invitador_id,
            u.usuario_id,
            u.email,
            u.nombre,
            u.telefono,
            'REGISTRADO'::text as tipo_registro,
            public.obtener_estado_consolidado_playero(pp.playero_id, pp.dueno_invitador_id) as estado,
            MIN(pp.fecha_alta) as fecha_alta_principal,
            MAX(pp.fecha_baja) as fecha_baja_principal,
            string_agg(DISTINCT pp.motivo_baja, '; ') as motivo_baja_principal,
            MIN(pp.fecha_creacion) as fecha_creacion_principal,
            MAX(pp.fecha_modificacion) as fecha_modificacion_principal,
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
        WHERE p.playa_dueno_id = p_dueno_id
        GROUP BY pp.playero_id, pp.dueno_invitador_id, u.usuario_id, u.email, u.nombre, u.telefono
    ),
    invitaciones_pendientes AS (
        SELECT 
            null::uuid as playero_id,
            pi.dueno_invitador_id,
            null::uuid as usuario_id,
            pi.email,
            pi.nombre,
            null::text as telefono,
            'INVITACION_PENDIENTE'::text as tipo_registro,
            'PENDIENTE'::text as estado,
            null::timestamptz as fecha_alta_principal,
            null::timestamptz as fecha_baja_principal,
            null::text as motivo_baja_principal,
            pi.fecha_invitacion as fecha_creacion_principal,
            pi.fecha_invitacion as fecha_modificacion_principal,
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
            array_length(pi.playas_ids, 1)::bigint as total_playas
        FROM public.playero_invitacion pi
        JOIN public.playa p ON p.playa_id = ANY(pi.playas_ids)
        WHERE pi.estado = 'PENDIENTE' 
        AND pi.fecha_expiracion > now()
        AND pi.dueno_invitador_id = p_dueno_id
        GROUP BY pi.invitacion_id, pi.dueno_invitador_id, pi.email, pi.nombre, pi.fecha_invitacion, pi.playas_ids
    ),
    combined_results AS (
        SELECT 
            pr.playero_id,
            pr.dueno_invitador_id,
            pr.usuario_id,
            pr.email,
            pr.nombre,
            pr.telefono,
            pr.tipo_registro,
            pr.estado,
            pr.fecha_alta_principal as fecha_alta,
            pr.fecha_baja_principal as fecha_baja,
            pr.motivo_baja_principal as motivo_baja,
            pr.fecha_creacion_principal as fecha_creacion,
            pr.fecha_modificacion_principal as fecha_modificacion,
            array_to_json(pr.playas_asignadas) as playas_asignadas,
            pr.total_playas
        FROM playeros_registrados pr
        
        UNION ALL
        
        SELECT 
            ip.playero_id,
            ip.dueno_invitador_id,
            ip.usuario_id,
            ip.email,
            ip.nombre,
            ip.telefono,
            ip.tipo_registro,
            ip.estado,
            ip.fecha_alta_principal as fecha_alta,
            ip.fecha_baja_principal as fecha_baja,
            ip.motivo_baja_principal as motivo_baja,
            ip.fecha_creacion_principal as fecha_creacion,
            ip.fecha_modificacion_principal as fecha_modificacion,
            array_to_json(ip.playas_asignadas) as playas_asignadas,
            ip.total_playas
        FROM invitaciones_pendientes ip
    )
    SELECT 
        cr.playero_id,
        cr.dueno_invitador_id,
        cr.usuario_id,
        cr.email,
        cr.nombre,
        cr.telefono,
        cr.tipo_registro,
        cr.estado,
        cr.fecha_alta,
        cr.fecha_baja,
        cr.motivo_baja,
        cr.fecha_creacion,
        cr.fecha_modificacion,
        cr.playas_asignadas,
        cr.total_playas
    FROM combined_results cr
    WHERE (
        p_search_query IS NULL 
        OR cr.nombre ILIKE '%' || p_search_query || '%'
        OR cr.email ILIKE '%' || p_search_query || '%'
    )
    ORDER BY cr.fecha_alta DESC NULLS LAST
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;


ALTER FUNCTION "public"."get_playeros_for_dueno"("p_dueno_id" "uuid", "p_search_query" "text", "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_playeros_for_dueno"("p_dueno_id" "uuid", "p_search_query" "text", "p_limit" integer, "p_offset" integer) IS 'Obtiene la lista de playeros para un dueño específico sin depender de RLS, incluyendo invitaciones pendientes';



CREATE OR REPLACE FUNCTION "public"."get_plaza_filters"("search_query" "text" DEFAULT NULL::"text", "applied_filters" "jsonb" DEFAULT '{}'::"jsonb", "playa_id_param" "uuid" DEFAULT NULL::"uuid") RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  result JSON;
  estados_array JSON;
  tipos_plaza_array JSON;
  where_conditions TEXT[];
  final_where TEXT;
BEGIN
  -- Condiciones base: plazas no eliminadas y de la playa especificada
  where_conditions := ARRAY['p.fecha_eliminacion IS NULL'];
  
  -- Filtrar por playa si se especifica
  IF playa_id_param IS NOT NULL THEN
    where_conditions := array_append(where_conditions, 
      format('p.playa_id = %L', playa_id_param)
    );
  END IF;
  
  -- Filtrar por búsqueda de texto (identificador)
  IF search_query IS NOT NULL AND search_query != '' THEN
    where_conditions := array_append(where_conditions, 
      format('p.identificador ILIKE %L', '%' || search_query || '%')
    );
  END IF;
  
  -- Aplicar filtros ya seleccionados
  IF applied_filters ? 'estado' AND jsonb_array_length(applied_filters->'estado') > 0 THEN
    where_conditions := array_append(where_conditions,
      format('p.estado = ANY(ARRAY[%s]::plaza_estado[])',
        (
          SELECT string_agg(quote_literal(value::text), ',')
          FROM jsonb_array_elements_text(applied_filters->'estado') AS value
        )
      )
    );
  END IF;
  
  IF applied_filters ? 'tipoPlaza' AND jsonb_array_length(applied_filters->'tipoPlaza') > 0 THEN
    where_conditions := array_append(where_conditions,
      format('p.tipo_plaza_id = ANY(ARRAY[%s]::integer[])',
        (
          SELECT string_agg(value::text, ',')
          FROM jsonb_array_elements_text(applied_filters->'tipoPlaza') AS value
        )
      )
    );
  END IF;
  
  final_where := array_to_string(where_conditions, ' AND ');
  
  -- Obtener estados disponibles
  EXECUTE format('
    WITH filtered_plazas AS (
      SELECT DISTINCT p.estado
      FROM plaza p
      WHERE %s
    ),
    estados_with_labels AS (
      SELECT 
        estado::text as value,
        CASE 
          WHEN estado = ''ACTIVO'' THEN ''Activo''
          WHEN estado = ''SUSPENDIDO'' THEN ''Suspendido''
          ELSE estado::text
        END as label
      FROM filtered_plazas
      ORDER BY estado
    )
    SELECT COALESCE(json_agg(
      json_build_object(
        ''value'', value,
        ''label'', label
      )
    ), ''[]''::json)
    FROM estados_with_labels
  ', final_where) INTO estados_array;

  -- Obtener tipos de plaza disponibles
  EXECUTE format('
    WITH filtered_tipos AS (
      SELECT DISTINCT tp.tipo_plaza_id, tp.nombre
      FROM plaza p
      JOIN tipo_plaza tp ON p.tipo_plaza_id = tp.tipo_plaza_id
      WHERE %s
    ),
    tipos_with_labels AS (
      SELECT 
        tipo_plaza_id::text as value,
        nombre as label
      FROM filtered_tipos
      ORDER BY nombre
    )
    SELECT COALESCE(json_agg(
      json_build_object(
        ''value'', value,
        ''label'', label
      )
    ), ''[]''::json)
    FROM tipos_with_labels
  ', final_where) INTO tipos_plaza_array;

  -- Construir resultado final
  SELECT json_build_object(
    'estado', json_build_object(
      'title', 'Estado',
      'options', estados_array,
      'pagination', false
    ),
    'tipoPlaza', json_build_object(
      'title', 'Tipo de Plaza',
      'options', tipos_plaza_array,
      'pagination', false
    )
  ) INTO result;

  RETURN result;
END;
$$;


ALTER FUNCTION "public"."get_plaza_filters"("search_query" "text", "applied_filters" "jsonb", "playa_id_param" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_tarifa_filters"("search_query" "text" DEFAULT NULL::"text", "applied_filters" "jsonb" DEFAULT '{}'::"jsonb", "playa_id_param" "uuid" DEFAULT NULL::"uuid") RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  result JSON;
  tipos_plaza_array JSON;
  modalidades_array JSON;
  tipos_vehiculo_array JSON;
  where_conditions TEXT[];
  final_where TEXT;
BEGIN
  -- Condiciones base: tarifas de la playa especificada con tipo_plaza no eliminado
  where_conditions := ARRAY['tp.fecha_eliminacion IS NULL'];
  
  -- Filtrar por playa (obligatorio para tarifas)
  IF playa_id_param IS NOT NULL THEN
    where_conditions := array_append(where_conditions, 
      format('t.playa_id = %L', playa_id_param)
    );
  ELSE
    -- Si no hay playa, retornar filtros vacíos
    SELECT json_build_object(
      'tipoPlaza', json_build_object(
        'title', 'Tipo de Plaza',
        'options', '[]'::json,
        'pagination', false
      ),
      'modalidadOcupacion', json_build_object(
        'title', 'Modalidad de Ocupación',
        'options', '[]'::json,
        'pagination', false
      ),
      'tipoVehiculo', json_build_object(
        'title', 'Tipo de Vehículo',
        'options', '[]'::json,
        'pagination', false
      )
    ) INTO result;
    RETURN result;
  END IF;
  
  -- Filtrar por búsqueda de texto
  IF search_query IS NOT NULL AND search_query != '' THEN
    where_conditions := array_append(where_conditions, 
      format('(tp.nombre ILIKE %L OR t.modalidad_ocupacion::text ILIKE %L OR t.tipo_vehiculo::text ILIKE %L)', 
        '%' || search_query || '%', 
        '%' || search_query || '%',
        '%' || search_query || '%'
      )
    );
  END IF;
  
  -- Aplicar filtros ya seleccionados por tipo de plaza
  IF applied_filters ? 'tipoPlaza' AND jsonb_array_length(applied_filters->'tipoPlaza') > 0 THEN
    where_conditions := array_append(where_conditions,
      format('t.tipo_plaza_id = ANY(ARRAY[%s]::bigint[])',
        (
          SELECT string_agg(value::text, ',')
          FROM jsonb_array_elements_text(applied_filters->'tipoPlaza') AS value
        )
      )
    );
  END IF;
  
  -- Aplicar filtros ya seleccionados por modalidad de ocupación
  IF applied_filters ? 'modalidadOcupacion' AND jsonb_array_length(applied_filters->'modalidadOcupacion') > 0 THEN
    where_conditions := array_append(where_conditions,
      format('t.modalidad_ocupacion = ANY(ARRAY[%s]::modalidad_ocupacion[])',
        (
          SELECT string_agg(format('%L', value), ',')
          FROM jsonb_array_elements_text(applied_filters->'modalidadOcupacion') AS value
        )
      )
    );
  END IF;
  
  -- Aplicar filtros ya seleccionados por tipo de vehículo
  IF applied_filters ? 'tipoVehiculo' AND jsonb_array_length(applied_filters->'tipoVehiculo') > 0 THEN
    where_conditions := array_append(where_conditions,
      format('t.tipo_vehiculo = ANY(ARRAY[%s]::tipo_vehiculo[])',
        (
          SELECT string_agg(format('%L', value), ',')
          FROM jsonb_array_elements_text(applied_filters->'tipoVehiculo') AS value
        )
      )
    );
  END IF;
  
  final_where := array_to_string(where_conditions, ' AND ');
  
  -- Obtener tipos de plaza disponibles
  EXECUTE format('
    WITH filtered_tarifas AS (
      SELECT DISTINCT t.tipo_plaza_id, tp.nombre
      FROM tarifa t
      JOIN tipo_plaza tp ON t.tipo_plaza_id = tp.tipo_plaza_id AND t.playa_id = tp.playa_id
      WHERE %s
      ORDER BY tp.nombre
    )
    SELECT COALESCE(json_agg(
      json_build_object(
        ''value'', tipo_plaza_id::text,
        ''label'', nombre
      )
    ), ''[]''::json)
    FROM filtered_tarifas
  ', final_where) INTO tipos_plaza_array;

  -- Obtener modalidades de ocupación disponibles
  EXECUTE format('
    WITH filtered_tarifas AS (
      SELECT DISTINCT t.modalidad_ocupacion
      FROM tarifa t
      JOIN tipo_plaza tp ON t.tipo_plaza_id = tp.tipo_plaza_id AND t.playa_id = tp.playa_id
      WHERE %s
    )
    SELECT COALESCE(json_agg(
      json_build_object(
        ''value'', modalidad_ocupacion::text,
        ''label'', CASE modalidad_ocupacion
          WHEN ''POR_HORA'' THEN ''Por Hora''
          WHEN ''DIARIA'' THEN ''Diaria''
          WHEN ''SEMANAL'' THEN ''Semanal''
          WHEN ''MENSUAL'' THEN ''Mensual''
          ELSE modalidad_ocupacion::text
        END
      ) ORDER BY CASE modalidad_ocupacion
        WHEN ''POR_HORA'' THEN 1
        WHEN ''DIARIA'' THEN 2
        WHEN ''SEMANAL'' THEN 3
        WHEN ''MENSUAL'' THEN 4
        ELSE 999
      END
    ), ''[]''::json)
    FROM filtered_tarifas
  ', final_where) INTO modalidades_array;

  -- Obtener tipos de vehículo disponibles
  EXECUTE format('
    WITH filtered_tarifas AS (
      SELECT DISTINCT t.tipo_vehiculo
      FROM tarifa t
      JOIN tipo_plaza tp ON t.tipo_plaza_id = tp.tipo_plaza_id AND t.playa_id = tp.playa_id
      WHERE %s
    )
    SELECT COALESCE(json_agg(
      json_build_object(
        ''value'', tipo_vehiculo::text,
        ''label'', CASE tipo_vehiculo
          WHEN ''AUTOMOVIL'' THEN ''Automóvil''
          WHEN ''MOTOCICLETA'' THEN ''Motocicleta''
          WHEN ''CAMIONETA'' THEN ''Camioneta''
          ELSE tipo_vehiculo::text
        END
      ) ORDER BY CASE tipo_vehiculo
        WHEN ''AUTOMOVIL'' THEN 1
        WHEN ''MOTOCICLETA'' THEN 2
        WHEN ''CAMIONETA'' THEN 3
        ELSE 999
      END
    ), ''[]''::json)
    FROM filtered_tarifas
  ', final_where) INTO tipos_vehiculo_array;

  -- Construir resultado final
  SELECT json_build_object(
    'tipoPlaza', json_build_object(
      'title', 'Tipo de Plaza',
      'options', tipos_plaza_array,
      'pagination', false
    ),
    'modalidadOcupacion', json_build_object(
      'title', 'Modalidad de Ocupación',
      'options', modalidades_array,
      'pagination', false
    ),
    'tipoVehiculo', json_build_object(
      'title', 'Tipo de Vehículo',
      'options', tipos_vehiculo_array,
      'pagination', false
    )
  ) INTO result;

  RETURN result;
END;
$$;


ALTER FUNCTION "public"."get_tarifa_filters"("search_query" "text", "applied_filters" "jsonb", "playa_id_param" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_tipo_plaza_filters"("search_query" "text" DEFAULT NULL::"text", "applied_filters" "jsonb" DEFAULT '{}'::"jsonb", "playa_id_param" "uuid" DEFAULT NULL::"uuid") RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  result JSON;
  caracteristicas_array JSON;
  where_conditions TEXT[];
  final_where TEXT;
BEGIN
  -- Condiciones base: tipos de plaza no eliminados y de la playa especificada
  where_conditions := ARRAY['tp.fecha_eliminacion IS NULL'];
  
  -- Filtrar por playa si se especifica
  IF playa_id_param IS NOT NULL THEN
    where_conditions := array_append(where_conditions, 
      format('tp.playa_id = %L', playa_id_param)
    );
  END IF;
  
  -- Filtrar por búsqueda de texto (nombre o descripción)
  IF search_query IS NOT NULL AND search_query != '' THEN
    where_conditions := array_append(where_conditions, 
      format('(tp.nombre ILIKE %L OR tp.descripcion ILIKE %L)', 
        '%' || search_query || '%', 
        '%' || search_query || '%'
      )
    );
  END IF;
  
  -- Aplicar filtros ya seleccionados por características
  IF applied_filters ? 'caracteristicas' AND jsonb_array_length(applied_filters->'caracteristicas') > 0 THEN
    where_conditions := array_append(where_conditions,
      format('EXISTS (
        SELECT 1 
        FROM tipo_plaza_caracteristica tpc 
        WHERE tpc.tipo_plaza_id = tp.tipo_plaza_id 
          AND tpc.caracteristica_id = ANY(ARRAY[%s]::integer[])
      )',
        (
          SELECT string_agg(value::text, ',')
          FROM jsonb_array_elements_text(applied_filters->'caracteristicas') AS value
        )
      )
    );
  END IF;
  
  final_where := array_to_string(where_conditions, ' AND ');
  
  -- Obtener características disponibles
  EXECUTE format('
    WITH filtered_tipos AS (
      SELECT DISTINCT tp.tipo_plaza_id
      FROM tipo_plaza tp
      WHERE %s
    ),
    caracteristicas_disponibles AS (
      SELECT DISTINCT c.caracteristica_id, c.nombre
      FROM filtered_tipos ft
      JOIN tipo_plaza_caracteristica tpc ON ft.tipo_plaza_id = tpc.tipo_plaza_id
      JOIN caracteristica c ON tpc.caracteristica_id = c.caracteristica_id
      ORDER BY c.nombre
    )
    SELECT COALESCE(json_agg(
      json_build_object(
        ''value'', caracteristica_id::text,
        ''label'', nombre
      )
    ), ''[]''::json)
    FROM caracteristicas_disponibles
  ', final_where) INTO caracteristicas_array;

  -- Construir resultado final
  SELECT json_build_object(
    'caracteristicas', json_build_object(
      'title', 'Características',
      'options', caracteristicas_array,
      'pagination', false
    )
  ) INTO result;

  RETURN result;
END;
$$;


ALTER FUNCTION "public"."get_tipo_plaza_filters"("search_query" "text", "applied_filters" "jsonb", "playa_id_param" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
declare
  v_nombre  text := coalesce(NEW.raw_user_meta_data->>'name', '');
  v_tel     text := coalesce(NEW.raw_user_meta_data->>'phone', 
                             NEW.raw_user_meta_data->>'telefono', null);
  v_rol_txt text := lower(trim(both from coalesce(NEW.raw_user_meta_data->>'role', '')));
  v_rol     public.rol;
  v_invitation_token text := NEW.raw_user_meta_data->>'invitation_token';
  v_invited_by uuid := (NEW.raw_user_meta_data->>'invited_by')::uuid;
  v_accept_result json;
  v_existing_user_id uuid;
begin
  -- Log inicial
  raise notice 'TRIGGER handle_new_user iniciado para usuario: % (email: %)', NEW.id, NEW.email;
  raise notice 'Metadatos recibidos: %', NEW.raw_user_meta_data;
  
  -- Determinar rol
  if v_rol_txt in ('dueno','dueño') then
    v_rol := 'DUENO'::public.rol;
    raise notice 'Rol determinado: DUENO';
  elsif v_rol_txt = 'playero' then
    v_rol := 'PLAYERO'::public.rol;
    raise notice 'Rol determinado: PLAYERO';
  else
    raise exception using
      message = format('Rol inválido "%s". Debe ser DUENO o PLAYERO en metadatos (role/rol).', v_rol_txt),
      errcode = '22023';
  end if;

  -- Verificar si ya existe un usuario con este email
  SELECT usuario_id INTO v_existing_user_id
  FROM public.usuario
  WHERE email = NEW.email;
  
  if v_existing_user_id IS NOT NULL AND v_existing_user_id != NEW.id then
    raise notice 'Usuario existente encontrado con email %, limpiando...', NEW.email;
    
    -- Limpiar usuario huérfano
    DELETE FROM public.playero_playa WHERE playero_id = v_existing_user_id;
    DELETE FROM public.rol_usuario WHERE usuario_id = v_existing_user_id;
    DELETE FROM public.usuario WHERE usuario_id = v_existing_user_id;
    
    raise notice 'Usuario huérfano limpiado';
  end if;

  -- Crear usuario en public.usuario
  raise notice 'Creando usuario en public.usuario...';
  begin
    insert into public.usuario (usuario_id, email, nombre, telefono)
    values (NEW.id, NEW.email, nullif(v_nombre, ''), v_tel)
    on conflict (usuario_id) do update
      set email    = excluded.email,
          nombre   = excluded.nombre,
          telefono = excluded.telefono;
    raise notice 'Usuario creado exitosamente en public.usuario';
  exception when others then
    raise exception 'Error creando usuario en public.usuario: %', SQLERRM;
  end;

  -- Asignar rol
  raise notice 'Asignando rol % al usuario...', v_rol;
  begin
    insert into public.rol_usuario (usuario_id, rol)
    values (NEW.id, v_rol)
    on conflict (usuario_id, rol) do nothing;
    raise notice 'Rol asignado exitosamente';
  exception when others then
    raise exception 'Error asignando rol: %', SQLERRM;
  end;

  -- Si es playero con token de invitación, procesar la invitación
  if v_rol = 'PLAYERO' and v_invitation_token is not null then
    raise notice 'Procesando invitación para playero con token: %', v_invitation_token;
    
    begin
      -- Usar función RPC para aceptar invitación por token
      select public.aceptar_invitacion_playero_por_token(
        p_token := v_invitation_token,
        p_auth_user_id := NEW.id,
        p_nombre_final := v_nombre
      ) into v_accept_result;
      
      -- Log del resultado
      if (v_accept_result->>'success')::boolean then
        raise notice 'Invitación aceptada exitosamente: %', v_accept_result->>'message';
      else
        raise warning 'Error al aceptar invitación: %', v_accept_result->>'error';
      end if;
    exception when others then
      raise exception 'Error procesando invitación: %', SQLERRM;
    end;
  else
    raise notice 'No es playero con invitación (rol: %, token: %)', v_rol, v_invitation_token;
  end if;

  raise notice 'TRIGGER handle_new_user completado exitosamente para usuario: %', NEW.id;
  return NEW;
exception when others then
  raise exception 'Error general en handle_new_user: %', SQLERRM;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."handle_new_user"() IS 'Trigger que maneja tanto signup de dueños como de playeros con token de invitación';



CREATE OR REPLACE FUNCTION "public"."limpiar_invitaciones_expiradas"() RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."limpiar_invitaciones_expiradas"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."limpiar_invitaciones_expiradas"() IS 'Marca como expiradas las invitaciones vencidas';



CREATE OR REPLACE FUNCTION "public"."limpiar_invitaciones_expiradas_email"("p_email" "text", "p_dueno_id" "uuid" DEFAULT "auth"."uid"()) RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_deleted_count integer;
BEGIN
    -- Eliminar físicamente invitaciones expiradas para permitir crear nuevas
    DELETE FROM public.playero_invitacion 
    WHERE email = p_email 
    AND dueno_invitador_id = p_dueno_id
    AND estado = 'EXPIRADA';
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    RETURN json_build_object(
        'success', true,
        'deleted_count', v_deleted_count,
        'message', format('Se eliminaron %s invitaciones expiradas para %s', v_deleted_count, p_email)
    );
END;
$$;


ALTER FUNCTION "public"."limpiar_invitaciones_expiradas_email"("p_email" "text", "p_dueno_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."limpiar_roles_playero_huerfanos"() RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."limpiar_roles_playero_huerfanos"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."limpiar_roles_playero_huerfanos"() IS 'Limpia roles PLAYERO de usuarios que no tienen relaciones playero_playa activas';



CREATE OR REPLACE FUNCTION "public"."obtener_detalle_playero"("p_playero_id" "uuid", "p_dueno_id" "uuid" DEFAULT "auth"."uid"()) RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_playero_data json;
    v_playas json;
BEGIN
    IF p_dueno_id IS NULL THEN
        RAISE EXCEPTION 'Usuario no autenticado';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.rol_usuario
        WHERE usuario_id = p_dueno_id AND rol = 'DUENO'
    ) THEN
        RAISE EXCEPTION 'Solo los dueños pueden ver detalles de playeros';
    END IF;

    SELECT json_build_object(
        'playero_id', u.usuario_id,
        'nombre', u.nombre,
        'email', u.email,
        'telefono', u.telefono,
        'fecha_creacion', u.fecha_creacion,
        'estado_global', COALESCE(
            (
                SELECT CASE
                    WHEN COUNT(*) FILTER (WHERE estado = 'ACTIVO') > 0 THEN 'ACTIVO'
                    WHEN COUNT(*) FILTER (WHERE estado = 'SUSPENDIDO') > 0 THEN 'SUSPENDIDO'
                    ELSE 'INACTIVO'
                END
                FROM public.playero_playa pp
                WHERE pp.playero_id = p_playero_id
                    AND EXISTS (
                        SELECT 1 FROM public.playa p
                        WHERE p.playa_id = pp.playa_id
                            AND p.dueno_id = p_dueno_id
                    )
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

    SELECT COALESCE(json_agg(
        json_build_object(
            'playa_id', p.playa_id,
            'playa_nombre', p.nombre,
            'playa_direccion', p.direccion,
            'estado', pp.estado,
            'fecha_asignacion', pp.fecha_asignacion
        )
        ORDER BY p.nombre
    ), '[]'::json)
    INTO v_playas
    FROM public.playero_playa pp
    INNER JOIN public.playa p ON p.playa_id = pp.playa_id
    WHERE pp.playero_id = p_playero_id
        AND p.dueno_id = p_dueno_id;

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


ALTER FUNCTION "public"."obtener_detalle_playero"("p_playero_id" "uuid", "p_dueno_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."obtener_detalles_invitacion"("p_email" "text", "p_dueno_id" "uuid") RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."obtener_detalles_invitacion"("p_email" "text", "p_dueno_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."obtener_detalles_invitacion"("p_email" "text", "p_dueno_id" "uuid") IS 'Obtiene los detalles de una invitación para mostrar en el formulario de aceptación';



CREATE OR REPLACE FUNCTION "public"."obtener_estado_consolidado_playero"("p_playero_id" "uuid", "p_dueno_id" "uuid") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."obtener_estado_consolidado_playero"("p_playero_id" "uuid", "p_dueno_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."obtener_estado_consolidado_playero"("p_playero_id" "uuid", "p_dueno_id" "uuid") IS 'Obtiene el estado consolidado de un playero basado en todas sus asignaciones con un dueño específico';



CREATE OR REPLACE FUNCTION "public"."rechazar_invitacion_playero"("p_token" "text") RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_invitacion public.playero_invitacion;
BEGIN
    UPDATE public.playero_invitacion 
    SET estado = 'RECHAZADA',
        fecha_modificacion = now()
    WHERE invitacion_id::text = p_token
    AND estado = 'PENDIENTE'
    AND fecha_expiracion > now()
    RETURNING * INTO v_invitacion;
    
    IF v_invitacion IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Invitación no encontrada o expirada'
        );
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Invitación rechazada correctamente'
    );
END;
$$;


ALTER FUNCTION "public"."rechazar_invitacion_playero"("p_token" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."rechazar_invitacion_playero"("p_token" "text") IS 'Permite rechazar una invitación usando el token';



CREATE OR REPLACE FUNCTION "public"."rechazar_playero"("p_playero_id" "uuid", "p_playa_id" "uuid", "p_motivo_rechazo" "text" DEFAULT 'Rechazado por el dueño'::"text", "p_dueno_id" "uuid" DEFAULT "auth"."uid"()) RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_affected_rows integer;
BEGIN
    -- Verificar que el dueño tiene permisos sobre la playa
    IF NOT EXISTS (
        SELECT 1 FROM public.playa 
        WHERE playa_id = p_playa_id 
        AND playa_dueno_id = p_dueno_id
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'No tienes permisos sobre esta playa'
        );
    END IF;
    
    -- Verificar que existe la relación pendiente
    IF NOT EXISTS (
        SELECT 1 FROM public.playero_playa 
        WHERE playero_id = p_playero_id 
        AND playa_id = p_playa_id 
        AND dueno_invitador_id = p_dueno_id
        AND estado = 'PENDIENTE'
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'No se encontró una invitación pendiente para este playero en esta playa'
        );
    END IF;
    
    -- Rechazar el playero (eliminar la relación)
    DELETE FROM public.playero_playa 
    WHERE playero_id = p_playero_id 
    AND playa_id = p_playa_id 
    AND dueno_invitador_id = p_dueno_id
    AND estado = 'PENDIENTE';
    
    GET DIAGNOSTICS v_affected_rows = ROW_COUNT;
    
    IF v_affected_rows > 0 THEN
        RETURN json_build_object(
            'success', true,
            'message', format('Playero rechazado: %s', p_motivo_rechazo)
        );
    ELSE
        RETURN json_build_object(
            'success', false,
            'error', 'No se pudo rechazar el playero'
        );
    END IF;
END;
$$;


ALTER FUNCTION "public"."rechazar_playero"("p_playero_id" "uuid", "p_playa_id" "uuid", "p_motivo_rechazo" "text", "p_dueno_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."rechazar_playero"("p_playero_id" "uuid", "p_playa_id" "uuid", "p_motivo_rechazo" "text", "p_dueno_id" "uuid") IS 'Función para rechazar un playero que está en estado PENDIENTE y eliminar la relación';



CREATE OR REPLACE FUNCTION "public"."reenviar_invitacion_playero"("p_email" "text", "p_dueno_id" "uuid" DEFAULT "auth"."uid"()) RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_invitacion_id uuid;
    v_nombre text;
    v_playas_ids uuid[];
    v_playas_nombres text[];
    v_dueno_nombre text;
    v_usuario_id uuid;
    v_usuario_existe boolean := false;
    v_accepted_count integer;
BEGIN
    SELECT COUNT(*) INTO v_accepted_count
    FROM public.playero_invitacion 
    WHERE email = p_email 
    AND dueno_invitador_id = p_dueno_id
    AND estado = 'ACEPTADA';
    
    IF v_accepted_count > 0 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'El playero ya ha aceptado su invitación y está activo en el sistema'
        );
    END IF;
    
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
    
    SELECT invitacion_id, nombre, playas_ids 
    INTO v_invitacion_id, v_nombre, v_playas_ids
    FROM public.playero_invitacion 
    WHERE email = p_email 
    AND dueno_invitador_id = p_dueno_id
    AND estado = 'PENDIENTE'
    ORDER BY fecha_invitacion DESC
    LIMIT 1;
    
    IF v_invitacion_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'No se encontró una invitación pendiente para este email'
        );
    END IF;

    DELETE FROM public.playero_invitacion
    WHERE email = p_email
    AND dueno_invitador_id = p_dueno_id;

    SELECT id INTO v_usuario_id
    FROM auth.users
    WHERE email = p_email;

    IF v_usuario_id IS NOT NULL THEN
        v_usuario_existe := true;
    END IF;

    INSERT INTO public.playero_invitacion (
        email, nombre, playas_ids, dueno_invitador_id, estado, fecha_invitacion, fecha_expiracion, fecha_modificacion
    ) VALUES (
        p_email, v_nombre, v_playas_ids, p_dueno_id, 'PENDIENTE', now(), now() + interval '7 days', now()
    ) RETURNING invitacion_id INTO v_invitacion_id;

    SELECT nombre INTO v_dueno_nombre FROM public.usuario WHERE usuario_id = p_dueno_id;

    SELECT array_agg(nombre) INTO v_playas_nombres FROM public.playa WHERE playa_id = ANY(v_playas_ids);

    RETURN json_build_object(
        'success', true,
        'invitacion_id', v_invitacion_id,
        'email', p_email,
        'nombre', v_nombre,
        'playas_ids', v_playas_ids,
        'dueno_nombre', v_dueno_nombre,
        'playas_nombres', v_playas_nombres,
        'usuario_existe', v_usuario_existe,
        'requires_email', true,
        'message', format('Nueva invitación creada y enviada a %s', p_email)
    );
END;
$$;


ALTER FUNCTION "public"."reenviar_invitacion_playero"("p_email" "text", "p_dueno_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."reenviar_invitacion_playero"("p_email" "text", "p_dueno_id" "uuid") IS 'Reenvía invitación eliminando la anterior y creando una nueva con token fresco';



CREATE OR REPLACE FUNCTION "public"."set_fecha_modificacion"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.fecha_modificacion = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_fecha_modificacion"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trg_playa_dueno_must_be_dueno"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  PERFORM public._assert_usuario_tiene_rol(NEW.playa_dueno_id, 'DUENO');
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trg_playa_dueno_must_be_dueno"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trg_playero_playa_validate_dueno_access"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM playa 
    WHERE playa_id = NEW.playa_id 
    AND playa_dueno_id = NEW.dueno_invitador_id
  ) THEN
    RAISE EXCEPTION 'El dueño invitador % no tiene acceso a la playa %', 
      NEW.dueno_invitador_id, NEW.playa_id
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trg_playero_playa_validate_dueno_access"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trg_playero_playa_validate_dueno_invitador"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  PERFORM public._assert_usuario_tiene_rol(NEW.dueno_invitador_id, 'DUENO');
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trg_playero_playa_validate_dueno_invitador"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trg_playeroplaya_user_must_be_playero"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  PERFORM public._assert_usuario_tiene_rol(NEW.playero_id, 'PLAYERO');
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trg_playeroplaya_user_must_be_playero"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trg_turno_user_must_be_playero_activo"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_activo BOOLEAN;
BEGIN
  PERFORM public._assert_usuario_tiene_rol(NEW.usuario_id, 'PLAYERO');

  -- Esta validación se activará cuando exista la tabla Playero_Playa
  /*
  SELECT (pp.estado = 'ACTIVO')
    INTO v_activo
    FROM public."Playero_Playa" pp
   WHERE pp.playa_id = NEW.playa_id
     AND pp.playero_id = NEW.usuario_id;

  IF v_activo IS DISTINCT FROM TRUE THEN
    RAISE EXCEPTION 'El usuario % no tiene acceso ACTIVO a la playa %',
      NEW.usuario_id, NEW.playa_id
      USING ERRCODE = '23514';
  END IF;
  */

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trg_turno_user_must_be_playero_activo"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trg_update_fecha_modificacion_playero_invitacion"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.fecha_modificacion = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trg_update_fecha_modificacion_playero_invitacion"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trg_update_fecha_modificacion_playero_playa"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.fecha_modificacion = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trg_update_fecha_modificacion_playero_playa"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_tipo_plaza_with_caracteristicas"("p_tipo_plaza_id" integer, "p_nombre" "text", "p_descripcion" "text" DEFAULT ''::"text", "p_caracteristicas" integer[] DEFAULT '{}'::integer[]) RETURNS TABLE("tipo_plaza_id" bigint, "playa_id" "uuid", "nombre" "text", "descripcion" "text", "fecha_creacion" timestamp with time zone, "fecha_modificacion" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_playa_id UUID;
  v_caracteristica_id INTEGER;
BEGIN
  -- Obtener el playa_id del tipo de plaza
  SELECT tp.playa_id INTO v_playa_id
  FROM tipo_plaza tp
  WHERE tp.tipo_plaza_id = p_tipo_plaza_id
    AND tp.fecha_eliminacion IS NULL;
  
  IF v_playa_id IS NULL THEN
    RAISE EXCEPTION 'Tipo de plaza no encontrado';
  END IF;

  -- Validar que todas las características existen
  IF array_length(p_caracteristicas, 1) > 0 THEN
    FOREACH v_caracteristica_id IN ARRAY p_caracteristicas
    LOOP
      IF NOT EXISTS (SELECT 1 FROM caracteristica c WHERE c.caracteristica_id = v_caracteristica_id) THEN
        RAISE EXCEPTION 'Característica con ID % no existe', v_caracteristica_id;
      END IF;
    END LOOP;
  END IF;

  -- Actualizar el tipo de plaza
  UPDATE tipo_plaza 
  SET 
    nombre = p_nombre,
    descripcion = p_descripcion,
    fecha_modificacion = NOW()
  WHERE tipo_plaza.tipo_plaza_id = p_tipo_plaza_id;

  -- Eliminar características existentes
  DELETE FROM tipo_plaza_caracteristica 
  WHERE tipo_plaza_caracteristica.tipo_plaza_id = p_tipo_plaza_id;

  -- Insertar nuevas características
  IF array_length(p_caracteristicas, 1) > 0 THEN
    FOREACH v_caracteristica_id IN ARRAY p_caracteristicas
    LOOP
      INSERT INTO tipo_plaza_caracteristica (playa_id, tipo_plaza_id, caracteristica_id)
      VALUES (v_playa_id, p_tipo_plaza_id, v_caracteristica_id);
    END LOOP;
  END IF;
  
  -- Retornar el tipo de plaza actualizado
  RETURN QUERY
  SELECT 
    t.tipo_plaza_id,
    t.playa_id,
    t.nombre,
    t.descripcion,
    t.fecha_creacion,
    t.fecha_modificacion
  FROM tipo_plaza t
  WHERE t.tipo_plaza_id = p_tipo_plaza_id;
  
END;
$$;


ALTER FUNCTION "public"."update_tipo_plaza_with_caracteristicas"("p_tipo_plaza_id" integer, "p_nombre" "text", "p_descripcion" "text", "p_caracteristicas" integer[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validar_token_invitacion"("p_token" "text") RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_invitacion public.playero_invitacion;
    v_dueno_nombre text;
    v_playas_nombres text[];
    v_usuario_existente uuid;
    v_usuario_tiene_cuenta boolean := false;
BEGIN
    SELECT * INTO v_invitacion
    FROM public.playero_invitacion 
    WHERE invitacion_id::text = p_token
    AND estado = 'PENDIENTE'
    AND fecha_expiracion > now();
    
    IF v_invitacion IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Token de invitación inválido o expirado'
        );
    END IF;
    
    SELECT nombre INTO v_dueno_nombre
    FROM public.usuario
    WHERE usuario_id = v_invitacion.dueno_invitador_id;
    
    SELECT array_agg(nombre) INTO v_playas_nombres
    FROM public.playa
    WHERE playa_id = ANY(v_invitacion.playas_ids);
    
    SELECT id INTO v_usuario_existente
    FROM auth.users
    WHERE email = v_invitacion.email;
    
    IF v_usuario_existente IS NOT NULL THEN
        v_usuario_tiene_cuenta := true;
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'data', json_build_object(
            'email', v_invitacion.email,
            'nombre', v_invitacion.nombre,
            'dueno_invitador_id', v_invitacion.dueno_invitador_id,
            'dueno_nombre', v_dueno_nombre,
            'playas_ids', v_invitacion.playas_ids,
            'playas_nombres', v_playas_nombres,
            'usuario_existe', v_usuario_tiene_cuenta,
            'usuario_id', v_usuario_existente
        )
    );
END;
$$;


ALTER FUNCTION "public"."validar_token_invitacion"("p_token" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."validar_token_invitacion"("p_token" "text") IS 'Valida token e indica si el usuario ya tiene cuenta registrada';



CREATE OR REPLACE FUNCTION "public"."verificar_dueno_es_playero"("p_dueno_id" "uuid" DEFAULT "auth"."uid"()) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."verificar_dueno_es_playero"("p_dueno_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."verificar_dueno_es_playero"("p_dueno_id" "uuid") IS 'Función corregida que verifica directamente en las tablas sin depender de RLS';



CREATE OR REPLACE FUNCTION "public"."verificar_email_existe"("p_email" "text") RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_usuario_id uuid;
    v_nombre text;
BEGIN
    SELECT id, raw_user_meta_data->>'name' 
    INTO v_usuario_id, v_nombre
    FROM auth.users
    WHERE email = p_email;
    
    IF v_usuario_id IS NOT NULL THEN
        RETURN json_build_object(
            'existe', true,
            'usuario_id', v_usuario_id,
            'nombre', v_nombre
        );
    ELSE
        RETURN json_build_object(
            'existe', false,
            'usuario_id', null,
            'nombre', null
        );
    END IF;
END;
$$;


ALTER FUNCTION "public"."verificar_email_existe"("p_email" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."verificar_email_existe"("p_email" "text") IS 'Verifica si un email ya está registrado en el sistema';



CREATE OR REPLACE FUNCTION "public"."verificar_roles_playero_huerfanos"() RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."verificar_roles_playero_huerfanos"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."verificar_roles_playero_huerfanos"() IS 'Verifica qué usuarios tienen roles PLAYERO sin relaciones playero_playa activas';


SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."caracteristica" (
    "caracteristica_id" bigint NOT NULL,
    "fecha_creacion" timestamp with time zone DEFAULT "now"() NOT NULL,
    "fecha_modificacion" timestamp with time zone DEFAULT "now"() NOT NULL,
    "nombre" "text" NOT NULL
);


ALTER TABLE "public"."caracteristica" OWNER TO "postgres";


ALTER TABLE "public"."caracteristica" ALTER COLUMN "caracteristica_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."caracteristica_caracteristica_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."ciudad" (
    "ciudad_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "nombre" "text" NOT NULL,
    "provincia" "text" NOT NULL,
    "fecha_creacion" timestamp with time zone DEFAULT "now"(),
    "fecha_modificacion" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ciudad" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."metodo_pago_playa" (
    "playa_id" "uuid" NOT NULL,
    "fecha_creacion" timestamp with time zone DEFAULT "now"() NOT NULL,
    "fecha_modificacion" timestamp with time zone DEFAULT "now"() NOT NULL,
    "estado" "public"."metodo_pago_estado" DEFAULT 'ACTIVO'::"public"."metodo_pago_estado" NOT NULL,
    "metodo_pago" "public"."metodo_pago" NOT NULL,
    "fecha_eliminacion" timestamp with time zone
);


ALTER TABLE "public"."metodo_pago_playa" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."modalidad_ocupacion_playa" (
    "playa_id" "uuid" NOT NULL,
    "fecha_creacion" timestamp with time zone DEFAULT "now"() NOT NULL,
    "fecha_modificacion" timestamp with time zone DEFAULT "now"() NOT NULL,
    "modalidad_ocupacion" "public"."modalidad_ocupacion" NOT NULL,
    "estado" "public"."modalidad_ocupacion_playa_estado" DEFAULT 'ACTIVO'::"public"."modalidad_ocupacion_playa_estado" NOT NULL,
    "fecha_eliminacion" timestamp with time zone
);


ALTER TABLE "public"."modalidad_ocupacion_playa" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."playa" (
    "playa_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "playa_dueno_id" "uuid" NOT NULL,
    "horario" "text",
    "descripcion" "text",
    "latitud" double precision NOT NULL,
    "longitud" double precision NOT NULL,
    "estado" "public"."playa_estado" DEFAULT 'BORRADOR'::"public"."playa_estado" NOT NULL,
    "fecha_creacion" timestamp with time zone DEFAULT "now"() NOT NULL,
    "fecha_modificacion" timestamp with time zone DEFAULT "now"() NOT NULL,
    "fecha_eliminacion" timestamp with time zone,
    "nombre" "text",
    "direccion" "text" NOT NULL,
    "ciudad_id" "uuid" NOT NULL,
  CONSTRAINT "playa_nombre_length_check" CHECK ((("nombre" IS NULL) OR ("char_length"("nombre") <= 35)))
);


ALTER TABLE "public"."playa" OWNER TO "postgres";


COMMENT ON CONSTRAINT "playa_nombre_length_check" ON "public"."playa" IS 'Limita el nombre de la playa a máximo 35 caracteres';



CREATE OR REPLACE VIEW "public"."playa_publica" AS
 SELECT "p"."playa_id",
    "p"."nombre",
    "p"."direccion",
    "p"."horario",
    "p"."descripcion",
    "p"."latitud",
    "p"."longitud",
    "p"."estado",
    "c"."nombre" AS "ciudad_nombre",
    "c"."provincia" AS "ciudad_provincia"
   FROM ("public"."playa" "p"
     JOIN "public"."ciudad" "c" ON (("p"."ciudad_id" = "c"."ciudad_id")))
  WHERE (("p"."estado" = 'ACTIVO'::"public"."playa_estado") AND ("p"."fecha_eliminacion" IS NULL));


ALTER TABLE "public"."playa_publica" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."playero_invitacion" (
    "invitacion_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "nombre" "text" NOT NULL,
    "dueno_invitador_id" "uuid" NOT NULL,
    "playas_ids" "uuid"[] NOT NULL,
    "estado" "text" DEFAULT 'PENDIENTE'::"text" NOT NULL,
    "fecha_invitacion" timestamp with time zone DEFAULT "now"() NOT NULL,
    "fecha_expiracion" timestamp with time zone DEFAULT ("now"() + '7 days'::interval) NOT NULL,
    "fecha_aceptacion" timestamp with time zone,
    "auth_user_id" "uuid",
    "fecha_modificacion" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "playero_invitacion_estado_check" CHECK (("estado" = ANY (ARRAY['PENDIENTE'::"text", 'ACEPTADA'::"text", 'EXPIRADA'::"text", 'RECHAZADA'::"text"])))
);


ALTER TABLE "public"."playero_invitacion" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."playero_playa" (
    "playero_id" "uuid" NOT NULL,
    "playa_id" "uuid" NOT NULL,
    "dueno_invitador_id" "uuid" NOT NULL,
    "estado" "public"."playero_playa_estado" DEFAULT 'ACTIVO'::"public"."playero_playa_estado" NOT NULL,
    "fecha_alta" timestamp with time zone DEFAULT "now"(),
    "fecha_baja" timestamp with time zone,
    "motivo_baja" "text",
    "fecha_creacion" timestamp with time zone DEFAULT "now"() NOT NULL,
    "fecha_modificacion" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."playero_playa" OWNER TO "postgres";


COMMENT ON TABLE "public"."playero_playa" IS 'Relación entre playeros y playas. Un playero puede trabajar en múltiples playas y una playa puede tener múltiples playeros.';



COMMENT ON COLUMN "public"."playero_playa"."playero_id" IS 'ID del usuario (public.usuario) con rol PLAYERO';



COMMENT ON COLUMN "public"."playero_playa"."playa_id" IS 'ID de la playa donde trabaja el playero';



COMMENT ON COLUMN "public"."playero_playa"."dueno_invitador_id" IS 'ID del usuario (public.usuario) con rol DUENO que invitó al playero';



COMMENT ON COLUMN "public"."playero_playa"."estado" IS 'Estado actual de la relación: ACTIVO o SUSPENDIDO';



COMMENT ON COLUMN "public"."playero_playa"."fecha_alta" IS 'Fecha cuando el playero se dio de alta en la playa';



COMMENT ON COLUMN "public"."playero_playa"."fecha_baja" IS 'Fecha cuando el playero se dio de baja de la playa (solo si estado=SUSPENDIDO)';



COMMENT ON COLUMN "public"."playero_playa"."motivo_baja" IS 'Motivo por el cual el playero se dio de baja de la playa';



CREATE TABLE IF NOT EXISTS "public"."usuario" (
    "usuario_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "nombre" "text" NOT NULL,
    "telefono" "text",
    "fecha_creacion" timestamp with time zone DEFAULT "now"() NOT NULL,
    "fecha_modificacion" timestamp with time zone DEFAULT "now"() NOT NULL,
    "fecha_eliminacion" timestamp with time zone
);


ALTER TABLE "public"."usuario" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."playeros_agrupados" AS
 WITH "playeros_registrados" AS (
         SELECT "pp"."playero_id",
            "u"."usuario_id",
            "u"."email",
            "u"."nombre",
            "u"."telefono",
            'REGISTRADO'::"text" AS "tipo_registro",
                CASE
                    WHEN "bool_or"(("pp"."estado" = 'ACTIVO'::"public"."playero_playa_estado")) THEN 'ACTIVO'::"public"."playero_playa_estado"
                    ELSE 'SUSPENDIDO'::"public"."playero_playa_estado"
                END AS "estado_principal",
            "max"("pp"."fecha_alta") AS "fecha_alta_principal",
            "max"("pp"."fecha_baja") AS "fecha_baja_principal",
                CASE
                    WHEN "bool_or"(("pp"."estado" = 'ACTIVO'::"public"."playero_playa_estado")) THEN NULL::"text"
                    ELSE ("array_agg"("pp"."motivo_baja" ORDER BY "pp"."fecha_alta" DESC NULLS LAST))[1]
                END AS "motivo_baja_principal",
            "max"("pp"."fecha_creacion") AS "fecha_creacion_principal",
            "max"("pp"."fecha_modificacion") AS "fecha_modificacion_principal",
            ("array_agg"("pp"."dueno_invitador_id" ORDER BY "pp"."fecha_alta" DESC NULLS LAST))[1] AS "dueno_invitador_id",
            "array_agg"("json_build_object"('playa_id', "p"."playa_id", 'nombre', "p"."nombre", 'direccion', "p"."direccion", 'estado', "pp"."estado", 'fecha_alta', "pp"."fecha_alta", 'fecha_baja', "pp"."fecha_baja") ORDER BY "pp"."fecha_alta" DESC NULLS LAST) AS "playas_asignadas",
            "count"("pp"."playa_id") AS "total_playas"
           FROM (("public"."playero_playa" "pp"
             JOIN "public"."usuario" "u" ON (("pp"."playero_id" = "u"."usuario_id")))
             JOIN "public"."playa" "p" ON (("pp"."playa_id" = "p"."playa_id")))
          WHERE ("p"."playa_dueno_id" = "pp"."dueno_invitador_id")
          GROUP BY "pp"."playero_id", "u"."usuario_id", "u"."email", "u"."nombre", "u"."telefono"
        ), "invitaciones_pendientes" AS (
         SELECT NULL::"uuid" AS "playero_id",
            NULL::"uuid" AS "usuario_id",
            "pi"."email",
            "pi"."nombre",
            NULL::"text" AS "telefono",
            'INVITACION_PENDIENTE'::"text" AS "tipo_registro",
            'PENDIENTE'::"public"."playero_playa_estado" AS "estado_principal",
            NULL::timestamp with time zone AS "fecha_alta_principal",
            NULL::timestamp with time zone AS "fecha_baja_principal",
            NULL::"text" AS "motivo_baja_principal",
            "pi"."fecha_invitacion" AS "fecha_creacion_principal",
            "pi"."fecha_invitacion" AS "fecha_modificacion_principal",
            "pi"."dueno_invitador_id",
            "array_agg"("json_build_object"('playa_id', "p"."playa_id", 'nombre', "p"."nombre", 'direccion', "p"."direccion", 'estado', 'PENDIENTE', 'fecha_alta', NULL::"unknown", 'fecha_baja', NULL::"unknown")) AS "playas_asignadas",
            "array_length"("pi"."playas_ids", 1) AS "total_playas"
           FROM ("public"."playero_invitacion" "pi"
             JOIN "public"."playa" "p" ON (("p"."playa_id" = ANY ("pi"."playas_ids"))))
          WHERE (("pi"."estado" = 'PENDIENTE'::"text") AND ("pi"."fecha_expiracion" > "now"()))
          GROUP BY "pi"."invitacion_id", "pi"."dueno_invitador_id", "pi"."email", "pi"."nombre", "pi"."fecha_invitacion", "pi"."playas_ids"
        )
 SELECT "playeros_registrados"."playero_id",
    "playeros_registrados"."dueno_invitador_id",
    "playeros_registrados"."usuario_id",
    "playeros_registrados"."email",
    "playeros_registrados"."nombre",
    "playeros_registrados"."telefono",
    "playeros_registrados"."tipo_registro",
    "playeros_registrados"."estado_principal" AS "estado",
    "playeros_registrados"."fecha_alta_principal" AS "fecha_alta",
    "playeros_registrados"."fecha_baja_principal" AS "fecha_baja",
    "playeros_registrados"."motivo_baja_principal" AS "motivo_baja",
    "playeros_registrados"."fecha_creacion_principal" AS "fecha_creacion",
    "playeros_registrados"."fecha_modificacion_principal" AS "fecha_modificacion",
    "playeros_registrados"."playas_asignadas",
    "playeros_registrados"."total_playas"
   FROM "playeros_registrados"
UNION ALL
 SELECT "invitaciones_pendientes"."playero_id",
    "invitaciones_pendientes"."dueno_invitador_id",
    "invitaciones_pendientes"."usuario_id",
    "invitaciones_pendientes"."email",
    "invitaciones_pendientes"."nombre",
    "invitaciones_pendientes"."telefono",
    "invitaciones_pendientes"."tipo_registro",
    "invitaciones_pendientes"."estado_principal" AS "estado",
    "invitaciones_pendientes"."fecha_alta_principal" AS "fecha_alta",
    "invitaciones_pendientes"."fecha_baja_principal" AS "fecha_baja",
    "invitaciones_pendientes"."motivo_baja_principal" AS "motivo_baja",
    "invitaciones_pendientes"."fecha_creacion_principal" AS "fecha_creacion",
    "invitaciones_pendientes"."fecha_modificacion_principal" AS "fecha_modificacion",
    "invitaciones_pendientes"."playas_asignadas",
    "invitaciones_pendientes"."total_playas"
   FROM "invitaciones_pendientes";


ALTER TABLE "public"."playeros_agrupados" OWNER TO "postgres";


COMMENT ON VIEW "public"."playeros_agrupados" IS 'Vista que muestra un registro por playero con todas sus playas asignadas del dueño actual, incluyendo invitaciones pendientes. El estado se determina según la lógica: ACTIVO si está activo en al menos una playa, SUSPENDIDO si está suspendido en todas, PENDIENTE para invitaciones.';



CREATE OR REPLACE VIEW "public"."playeros_con_estado_consolidado" WITH ("security_invoker"='true') AS
 WITH "playeros_registrados" AS (
         SELECT "pp"."playero_id",
            "pp"."dueno_invitador_id",
            "u"."usuario_id",
            "u"."email",
            "u"."nombre",
            "u"."telefono",
            'REGISTRADO'::"text" AS "tipo_registro",
            "public"."obtener_estado_consolidado_playero"("pp"."playero_id", "pp"."dueno_invitador_id") AS "estado",
            "min"("pp"."fecha_alta") AS "fecha_alta_principal",
            "max"("pp"."fecha_baja") AS "fecha_baja_principal",
            "string_agg"(DISTINCT "pp"."motivo_baja", '; '::"text") AS "motivo_baja_principal",
            "min"("pp"."fecha_creacion") AS "fecha_creacion_principal",
            "max"("pp"."fecha_modificacion") AS "fecha_modificacion_principal",
            "array_agg"("json_build_object"('playa_id', "p"."playa_id", 'nombre', "p"."nombre", 'direccion', "p"."direccion", 'estado', "pp"."estado", 'fecha_alta', "pp"."fecha_alta", 'fecha_baja', "pp"."fecha_baja") ORDER BY "pp"."fecha_alta" DESC NULLS LAST) AS "playas_asignadas",
            "count"("pp"."playa_id") AS "total_playas"
           FROM (("public"."playero_playa" "pp"
             JOIN "public"."usuario" "u" ON (("pp"."playero_id" = "u"."usuario_id")))
             JOIN "public"."playa" "p" ON (("pp"."playa_id" = "p"."playa_id")))
          WHERE ("p"."playa_dueno_id" = "pp"."dueno_invitador_id")
          GROUP BY "pp"."playero_id", "pp"."dueno_invitador_id", "u"."usuario_id", "u"."email", "u"."nombre", "u"."telefono"
        ), "invitaciones_pendientes" AS (
         SELECT NULL::"uuid" AS "playero_id",
            "pi"."dueno_invitador_id",
            NULL::"uuid" AS "usuario_id",
            "pi"."email",
            "pi"."nombre",
            NULL::"text" AS "telefono",
            'INVITACION_PENDIENTE'::"text" AS "tipo_registro",
            'PENDIENTE'::"text" AS "estado",
            NULL::timestamp with time zone AS "fecha_alta_principal",
            NULL::timestamp with time zone AS "fecha_baja_principal",
            NULL::"text" AS "motivo_baja_principal",
            "pi"."fecha_invitacion" AS "fecha_creacion_principal",
            "pi"."fecha_invitacion" AS "fecha_modificacion_principal",
            "array_agg"("json_build_object"('playa_id', "p"."playa_id", 'nombre', "p"."nombre", 'direccion', "p"."direccion", 'estado', 'PENDIENTE', 'fecha_alta', NULL::"unknown", 'fecha_baja', NULL::"unknown")) AS "playas_asignadas",
            "array_length"("pi"."playas_ids", 1) AS "total_playas"
           FROM ("public"."playero_invitacion" "pi"
             JOIN "public"."playa" "p" ON (("p"."playa_id" = ANY ("pi"."playas_ids"))))
          WHERE (("pi"."estado" = 'PENDIENTE'::"text") AND ("pi"."fecha_expiracion" > "now"()) AND ("p"."playa_dueno_id" = "pi"."dueno_invitador_id"))
          GROUP BY "pi"."invitacion_id", "pi"."dueno_invitador_id", "pi"."email", "pi"."nombre", "pi"."fecha_invitacion", "pi"."playas_ids"
        )
 SELECT "playeros_registrados"."playero_id",
    "playeros_registrados"."dueno_invitador_id",
    "playeros_registrados"."usuario_id",
    "playeros_registrados"."email",
    "playeros_registrados"."nombre",
    "playeros_registrados"."telefono",
    "playeros_registrados"."tipo_registro",
    "playeros_registrados"."estado",
    "playeros_registrados"."fecha_alta_principal" AS "fecha_alta",
    "playeros_registrados"."fecha_baja_principal" AS "fecha_baja",
    "playeros_registrados"."motivo_baja_principal" AS "motivo_baja",
    "playeros_registrados"."fecha_creacion_principal" AS "fecha_creacion",
    "playeros_registrados"."fecha_modificacion_principal" AS "fecha_modificacion",
    "playeros_registrados"."playas_asignadas",
    "playeros_registrados"."total_playas"
   FROM "playeros_registrados"
UNION ALL
 SELECT "invitaciones_pendientes"."playero_id",
    "invitaciones_pendientes"."dueno_invitador_id",
    "invitaciones_pendientes"."usuario_id",
    "invitaciones_pendientes"."email",
    "invitaciones_pendientes"."nombre",
    "invitaciones_pendientes"."telefono",
    "invitaciones_pendientes"."tipo_registro",
    "invitaciones_pendientes"."estado",
    "invitaciones_pendientes"."fecha_alta_principal" AS "fecha_alta",
    "invitaciones_pendientes"."fecha_baja_principal" AS "fecha_baja",
    "invitaciones_pendientes"."motivo_baja_principal" AS "motivo_baja",
    "invitaciones_pendientes"."fecha_creacion_principal" AS "fecha_creacion",
    "invitaciones_pendientes"."fecha_modificacion_principal" AS "fecha_modificacion",
    "invitaciones_pendientes"."playas_asignadas",
    "invitaciones_pendientes"."total_playas"
   FROM "invitaciones_pendientes";


ALTER TABLE "public"."playeros_con_estado_consolidado" OWNER TO "postgres";


COMMENT ON VIEW "public"."playeros_con_estado_consolidado" IS 'Vista mejorada que muestra playeros con estado consolidado basado en todas sus asignaciones por dueño';



CREATE OR REPLACE VIEW "public"."playeros_con_invitaciones" AS
 SELECT "pp"."playero_id",
    "pp"."playa_id",
    "pp"."dueno_invitador_id",
    "pp"."estado",
    "pp"."fecha_alta",
    "pp"."fecha_baja",
    "pp"."motivo_baja",
    "pp"."fecha_creacion",
    "pp"."fecha_modificacion",
    "u"."usuario_id",
    "u"."email",
    "u"."nombre",
    "u"."telefono",
    'REGISTRADO'::"text" AS "tipo_registro"
   FROM ("public"."playero_playa" "pp"
     JOIN "public"."usuario" "u" ON (("pp"."playero_id" = "u"."usuario_id")))
UNION ALL
 SELECT NULL::"uuid" AS "playero_id",
    "unnest"("pi"."playas_ids") AS "playa_id",
    "pi"."dueno_invitador_id",
    'PENDIENTE'::"public"."playero_playa_estado" AS "estado",
    NULL::timestamp with time zone AS "fecha_alta",
    NULL::timestamp with time zone AS "fecha_baja",
    NULL::"text" AS "motivo_baja",
    "pi"."fecha_invitacion" AS "fecha_creacion",
    "pi"."fecha_invitacion" AS "fecha_modificacion",
    NULL::"uuid" AS "usuario_id",
    "pi"."email",
    "pi"."nombre",
    NULL::"text" AS "telefono",
    'INVITACION_PENDIENTE'::"text" AS "tipo_registro"
   FROM "public"."playero_invitacion" "pi"
  WHERE (("pi"."estado" = 'PENDIENTE'::"text") AND ("pi"."fecha_expiracion" > "now"()));


ALTER TABLE "public"."playeros_con_invitaciones" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."plaza" (
    "plaza_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "fecha_creacion" timestamp with time zone DEFAULT "now"() NOT NULL,
    "fecha_modificacion" timestamp with time zone DEFAULT "now"(),
    "playa_id" "uuid" NOT NULL,
    "tipo_plaza_id" bigint NOT NULL,
    "identificador" "text",
    "estado" "public"."plaza_estado" DEFAULT 'ACTIVO'::"public"."plaza_estado" NOT NULL,
    "fecha_eliminacion" timestamp with time zone
);


ALTER TABLE "public"."plaza" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rol_usuario" (
    "usuario_id" "uuid" NOT NULL,
    "rol" "public"."rol" NOT NULL
);


ALTER TABLE "public"."rol_usuario" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tarifa" (
    "playa_id" "uuid" NOT NULL,
    "fecha_creacion" timestamp with time zone DEFAULT "now"() NOT NULL,
    "fecha_modificacion" timestamp with time zone DEFAULT "now"() NOT NULL,
    "tipo_plaza_id" bigint NOT NULL,
    "modalidad_ocupacion" "public"."modalidad_ocupacion" NOT NULL,
    "tipo_vehiculo" "public"."tipo_vehiculo" NOT NULL,
    "precio_base" real NOT NULL
);


ALTER TABLE "public"."tarifa" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tipo_plaza" (
    "tipo_plaza_id" bigint NOT NULL,
    "playa_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "fecha_creacion" timestamp with time zone DEFAULT "now"() NOT NULL,
    "fecha_modificacion" timestamp with time zone DEFAULT "now"() NOT NULL,
    "fecha_eliminacion" timestamp with time zone,
    "nombre" "text" NOT NULL,
    "descripcion" "text" DEFAULT ''::"text"
);


ALTER TABLE "public"."tipo_plaza" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tipo_plaza_caracteristica" (
    "playa_id" "uuid" NOT NULL,
    "tipo_plaza_id" bigint NOT NULL,
    "caracteristica_id" bigint NOT NULL,
    "fecha_creacion" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."tipo_plaza_caracteristica" OWNER TO "postgres";


ALTER TABLE "public"."tipo_plaza" ALTER COLUMN "tipo_plaza_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."tipo_plaza_tipo_plaza_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."tipo_vehiculo_playa" (
    "playa_id" "uuid" NOT NULL,
    "fecha_creacion" timestamp with time zone DEFAULT "now"() NOT NULL,
    "fecha_modificacion" timestamp with time zone DEFAULT "now"() NOT NULL,
    "estado" "public"."tipo_vehiculo_estado" DEFAULT 'ACTIVO'::"public"."tipo_vehiculo_estado" NOT NULL,
    "tipo_vehiculo" "public"."tipo_vehiculo" NOT NULL
);


ALTER TABLE "public"."tipo_vehiculo_playa" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."turno" (
    "playa_id" "uuid" NOT NULL,
    "playero_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "fecha_hora_ingreso" timestamp with time zone DEFAULT "now"() NOT NULL,
    "fecha_hora_salida" timestamp with time zone,
    "efectivo_inicial" numeric(10,2) DEFAULT 0 NOT NULL,
    "efectivo_final" numeric(10,2)
);


ALTER TABLE "public"."turno" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_plazas" WITH ("security_invoker"='true') AS
 SELECT "p"."plaza_id",
    "p"."identificador",
    "p"."estado" AS "plaza_estado",
    "p"."fecha_creacion",
    "p"."fecha_modificacion",
    "p"."fecha_eliminacion",
    "p"."playa_id",
    "p"."tipo_plaza_id",
    "pl"."direccion" AS "playa_direccion",
    "pl"."nombre" AS "playa_nombre",
    "pl"."estado" AS "playa_estado",
    "tp"."nombre" AS "tipo_plaza_nombre",
    "tp"."descripcion" AS "tipo_plaza_descripcion"
   FROM (("public"."plaza" "p"
     LEFT JOIN "public"."playa" "pl" ON (("p"."playa_id" = "pl"."playa_id")))
     LEFT JOIN "public"."tipo_plaza" "tp" ON ((("p"."tipo_plaza_id" = "tp"."tipo_plaza_id") AND ("p"."playa_id" = "tp"."playa_id"))))
  WHERE (("p"."fecha_eliminacion" IS NULL) AND ("pl"."playa_dueno_id" = "auth"."uid"()) AND ("pl"."fecha_eliminacion" IS NULL));


ALTER TABLE "public"."v_plazas" OWNER TO "postgres";


COMMENT ON VIEW "public"."v_plazas" IS 'Vista de plazas con información relacionada de playa y tipo de plaza. Respeta las políticas RLS: solo muestra plazas de playas del usuario autenticado.';



CREATE OR REPLACE VIEW "public"."v_tarifas" AS
 SELECT "t"."playa_id",
    "t"."tipo_plaza_id",
    "t"."modalidad_ocupacion",
    "t"."tipo_vehiculo",
    "t"."precio_base",
    "t"."fecha_creacion",
    "t"."fecha_modificacion",
    "tp"."nombre" AS "tipo_plaza_nombre",
    "tp"."descripcion" AS "tipo_plaza_descripcion",
        CASE "t"."modalidad_ocupacion"
            WHEN 'POR_HORA'::"public"."modalidad_ocupacion" THEN 1
            WHEN 'DIARIA'::"public"."modalidad_ocupacion" THEN 2
            WHEN 'SEMANAL'::"public"."modalidad_ocupacion" THEN 3
            WHEN 'MENSUAL'::"public"."modalidad_ocupacion" THEN 4
            ELSE 999
        END AS "modalidad_ocupacion_order",
        CASE "t"."tipo_vehiculo"
            WHEN 'AUTOMOVIL'::"public"."tipo_vehiculo" THEN 1
            WHEN 'MOTOCICLETA'::"public"."tipo_vehiculo" THEN 2
            WHEN 'CAMIONETA'::"public"."tipo_vehiculo" THEN 3
            ELSE 999
        END AS "tipo_vehiculo_order"
   FROM ("public"."tarifa" "t"
     LEFT JOIN "public"."tipo_plaza" "tp" ON ((("t"."tipo_plaza_id" = "tp"."tipo_plaza_id") AND ("t"."playa_id" = "tp"."playa_id"))))
  WHERE ("tp"."fecha_eliminacion" IS NULL);


ALTER TABLE "public"."v_tarifas" OWNER TO "postgres";


COMMENT ON VIEW "public"."v_tarifas" IS 'Vista de tarifas con información relacionada de tipo de plaza. Incluye campos de ordenamiento para enums modalidad_ocupacion y tipo_vehiculo.';



CREATE OR REPLACE VIEW "public"."v_user_with_roles" WITH ("security_invoker"='true') AS
 SELECT "u"."id" AS "usuario_id",
    "u"."email",
    ("u"."raw_user_meta_data" ->> 'name'::"text") AS "nombre",
    ("u"."raw_user_meta_data" ->> 'phone'::"text") AS "telefono",
    COALESCE("array_agg"("ru"."rol") FILTER (WHERE ("ru"."rol" IS NOT NULL)), ARRAY[]::"public"."rol"[]) AS "roles",
    "u"."created_at" AS "fecha_creacion",
    "u"."updated_at" AS "fecha_modificacion"
   FROM ("auth"."users" "u"
     LEFT JOIN "public"."rol_usuario" "ru" ON (("u"."id" = "ru"."usuario_id")))
  WHERE ("u"."id" = "auth"."uid"())
  GROUP BY "u"."id", "u"."email", "u"."raw_user_meta_data", "u"."created_at", "u"."updated_at";


ALTER TABLE "public"."v_user_with_roles" OWNER TO "postgres";


COMMENT ON VIEW "public"."v_user_with_roles" IS 'Vista unificada que combina datos del usuario de auth.users con sus roles de rol_usuario. Optimizada para reducir queries de autenticación de 2 a 1.';



ALTER TABLE ONLY "public"."playa"
    ADD CONSTRAINT "Playa_pkey" PRIMARY KEY ("playa_id");



ALTER TABLE ONLY "public"."rol_usuario"
    ADD CONSTRAINT "Rol_Usuario_pkey" PRIMARY KEY ("usuario_id", "rol");



ALTER TABLE ONLY "public"."usuario"
    ADD CONSTRAINT "Usuario_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."usuario"
    ADD CONSTRAINT "Usuario_pkey" PRIMARY KEY ("usuario_id");



ALTER TABLE ONLY "public"."caracteristica"
    ADD CONSTRAINT "caracteristica_nombre_key" UNIQUE ("nombre");



ALTER TABLE ONLY "public"."caracteristica"
    ADD CONSTRAINT "caracteristica_pkey" PRIMARY KEY ("caracteristica_id");



ALTER TABLE ONLY "public"."ciudad"
    ADD CONSTRAINT "ciudad_nombre_provincia_key" UNIQUE ("nombre", "provincia");



ALTER TABLE ONLY "public"."ciudad"
    ADD CONSTRAINT "ciudad_pkey" PRIMARY KEY ("ciudad_id");



ALTER TABLE ONLY "public"."playero_invitacion"
    ADD CONSTRAINT "idx_playero_invitacion_email_estado" UNIQUE ("email", "estado") DEFERRABLE INITIALLY DEFERRED;



ALTER TABLE ONLY "public"."metodo_pago_playa"
    ADD CONSTRAINT "metodo_pago_playa_pkey" PRIMARY KEY ("playa_id", "metodo_pago");



ALTER TABLE ONLY "public"."modalidad_ocupacion_playa"
    ADD CONSTRAINT "modalidad_ocupacion_playa_pkey" PRIMARY KEY ("playa_id", "modalidad_ocupacion");



ALTER TABLE ONLY "public"."playero_invitacion"
    ADD CONSTRAINT "playero_invitacion_pkey" PRIMARY KEY ("invitacion_id");



ALTER TABLE ONLY "public"."playero_playa"
    ADD CONSTRAINT "playero_playa_pkey" PRIMARY KEY ("playero_id", "playa_id");



ALTER TABLE ONLY "public"."plaza"
    ADD CONSTRAINT "plaza_identificador_playa_unique" UNIQUE ("identificador", "playa_id");



ALTER TABLE ONLY "public"."plaza"
    ADD CONSTRAINT "plaza_pkey" PRIMARY KEY ("plaza_id");



ALTER TABLE ONLY "public"."tarifa"
    ADD CONSTRAINT "tarifa_pkey" PRIMARY KEY ("playa_id", "tipo_plaza_id", "modalidad_ocupacion", "tipo_vehiculo");



ALTER TABLE ONLY "public"."tipo_plaza_caracteristica"
    ADD CONSTRAINT "tipo_plaza_caracteristica_pkey" PRIMARY KEY ("playa_id", "tipo_plaza_id", "caracteristica_id");



ALTER TABLE ONLY "public"."tipo_plaza"
    ADD CONSTRAINT "tipo_plaza_pkey" PRIMARY KEY ("tipo_plaza_id", "playa_id");



ALTER TABLE ONLY "public"."tipo_vehiculo_playa"
    ADD CONSTRAINT "tipo_vehiculo_playa_pkey" PRIMARY KEY ("playa_id", "tipo_vehiculo");



ALTER TABLE ONLY "public"."turno"
    ADD CONSTRAINT "turno_pkey" PRIMARY KEY ("playa_id", "playero_id", "fecha_hora_ingreso");



ALTER TABLE ONLY "public"."playa"
    ADD CONSTRAINT "unique_playa_address_per_user" UNIQUE ("playa_dueno_id", "direccion", "ciudad_id");



ALTER TABLE ONLY "public"."playa"
    ADD CONSTRAINT "unique_playa_coordinates_per_user" UNIQUE ("playa_dueno_id", "latitud", "longitud");



CREATE INDEX "idx_playa_ciudad_id" ON "public"."playa" USING "btree" ("ciudad_id");



CREATE INDEX "idx_playa_direccion" ON "public"."playa" USING "btree" ("direccion");



CREATE INDEX "idx_playa_nombre" ON "public"."playa" USING "btree" ("nombre");



CREATE INDEX "idx_playero_invitacion_dueno" ON "public"."playero_invitacion" USING "btree" ("dueno_invitador_id");



CREATE INDEX "idx_playero_invitacion_estado" ON "public"."playero_invitacion" USING "btree" ("estado");



CREATE INDEX "idx_playero_invitacion_fecha_exp" ON "public"."playero_invitacion" USING "btree" ("fecha_expiracion");



CREATE INDEX "idx_playero_playa_dueno_invitador_id" ON "public"."playero_playa" USING "btree" ("dueno_invitador_id");



CREATE INDEX "idx_playero_playa_estado" ON "public"."playero_playa" USING "btree" ("estado");



CREATE INDEX "idx_playero_playa_fecha_alta" ON "public"."playero_playa" USING "btree" ("fecha_alta");



CREATE INDEX "idx_playero_playa_fecha_baja" ON "public"."playero_playa" USING "btree" ("fecha_baja");



CREATE INDEX "idx_playero_playa_playa_id" ON "public"."playero_playa" USING "btree" ("playa_id");



CREATE INDEX "idx_playero_playa_playero_id" ON "public"."playero_playa" USING "btree" ("playero_id");



CREATE UNIQUE INDEX "turno_unico_abierto" ON "public"."turno" USING "btree" ("playa_id", "playero_id") WHERE ("fecha_hora_salida" IS NULL);



CREATE UNIQUE INDEX "unique_email_dueno_pending_only" ON "public"."playero_invitacion" USING "btree" ("email", "dueno_invitador_id") WHERE ("estado" = 'PENDIENTE'::"text");



CREATE OR REPLACE TRIGGER "trg_playa_update" BEFORE UPDATE ON "public"."playa" FOR EACH ROW EXECUTE FUNCTION "public"."set_fecha_modificacion"();



CREATE OR REPLACE TRIGGER "trg_playero_playa_validate_dueno_access" BEFORE INSERT OR UPDATE ON "public"."playero_playa" FOR EACH ROW EXECUTE FUNCTION "public"."trg_playero_playa_validate_dueno_access"();



CREATE OR REPLACE TRIGGER "trg_playero_playa_validate_dueno_invitador" BEFORE INSERT OR UPDATE ON "public"."playero_playa" FOR EACH ROW EXECUTE FUNCTION "public"."trg_playero_playa_validate_dueno_invitador"();



CREATE OR REPLACE TRIGGER "trg_playero_playa_validate_playero" BEFORE INSERT OR UPDATE ON "public"."playero_playa" FOR EACH ROW EXECUTE FUNCTION "public"."trg_playeroplaya_user_must_be_playero"();



CREATE OR REPLACE TRIGGER "trg_update_fecha_modificacion_playero_invitacion" BEFORE UPDATE ON "public"."playero_invitacion" FOR EACH ROW EXECUTE FUNCTION "public"."trg_update_fecha_modificacion_playero_invitacion"();



CREATE OR REPLACE TRIGGER "trg_update_fecha_modificacion_playero_playa" BEFORE UPDATE ON "public"."playero_playa" FOR EACH ROW EXECUTE FUNCTION "public"."trg_update_fecha_modificacion_playero_playa"();



CREATE OR REPLACE TRIGGER "trg_usuario_update" BEFORE UPDATE ON "public"."usuario" FOR EACH ROW EXECUTE FUNCTION "public"."set_fecha_modificacion"();



CREATE OR REPLACE TRIGGER "trigger_playa_dueno_must_be_dueno" BEFORE INSERT OR UPDATE ON "public"."playa" FOR EACH ROW EXECUTE FUNCTION "public"."trg_playa_dueno_must_be_dueno"();



CREATE OR REPLACE TRIGGER "trigger_set_fecha_modificacion_caracteristica" BEFORE UPDATE ON "public"."caracteristica" FOR EACH ROW EXECUTE FUNCTION "public"."set_fecha_modificacion"();



CREATE OR REPLACE TRIGGER "trigger_set_fecha_modificacion_ciudad" BEFORE UPDATE ON "public"."ciudad" FOR EACH ROW EXECUTE FUNCTION "public"."set_fecha_modificacion"();



CREATE OR REPLACE TRIGGER "trigger_set_fecha_modificacion_metodo_pago_playa" BEFORE UPDATE ON "public"."metodo_pago_playa" FOR EACH ROW EXECUTE FUNCTION "public"."set_fecha_modificacion"();



CREATE OR REPLACE TRIGGER "trigger_set_fecha_modificacion_modalidad_ocupacion_playa" BEFORE UPDATE ON "public"."modalidad_ocupacion_playa" FOR EACH ROW EXECUTE FUNCTION "public"."set_fecha_modificacion"();



CREATE OR REPLACE TRIGGER "trigger_set_fecha_modificacion_playa" BEFORE UPDATE ON "public"."playa" FOR EACH ROW EXECUTE FUNCTION "public"."set_fecha_modificacion"();



CREATE OR REPLACE TRIGGER "trigger_set_fecha_modificacion_plaza" BEFORE UPDATE ON "public"."plaza" FOR EACH ROW EXECUTE FUNCTION "public"."set_fecha_modificacion"();



CREATE OR REPLACE TRIGGER "trigger_set_fecha_modificacion_tarifa" BEFORE UPDATE ON "public"."tarifa" FOR EACH ROW EXECUTE FUNCTION "public"."set_fecha_modificacion"();



CREATE OR REPLACE TRIGGER "trigger_set_fecha_modificacion_tipo_plaza" BEFORE UPDATE ON "public"."tipo_plaza" FOR EACH ROW EXECUTE FUNCTION "public"."set_fecha_modificacion"();



CREATE OR REPLACE TRIGGER "trigger_set_fecha_modificacion_tipo_vehiculo_playa" BEFORE UPDATE ON "public"."tipo_vehiculo_playa" FOR EACH ROW EXECUTE FUNCTION "public"."set_fecha_modificacion"();



CREATE OR REPLACE TRIGGER "trigger_set_fecha_modificacion_usuario" BEFORE UPDATE ON "public"."usuario" FOR EACH ROW EXECUTE FUNCTION "public"."set_fecha_modificacion"();



ALTER TABLE ONLY "public"."playa"
    ADD CONSTRAINT "Playa_playa_dueno_id_fkey" FOREIGN KEY ("playa_dueno_id") REFERENCES "public"."usuario"("usuario_id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."rol_usuario"
    ADD CONSTRAINT "Rol_Usuario_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuario"("usuario_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tipo_plaza_caracteristica"
    ADD CONSTRAINT "fk_car" FOREIGN KEY ("caracteristica_id") REFERENCES "public"."caracteristica"("caracteristica_id");



ALTER TABLE ONLY "public"."playa"
    ADD CONSTRAINT "fk_playa_ciudad" FOREIGN KEY ("ciudad_id") REFERENCES "public"."ciudad"("ciudad_id");



ALTER TABLE ONLY "public"."tipo_plaza_caracteristica"
    ADD CONSTRAINT "fk_tp" FOREIGN KEY ("playa_id", "tipo_plaza_id") REFERENCES "public"."tipo_plaza"("playa_id", "tipo_plaza_id");



ALTER TABLE ONLY "public"."metodo_pago_playa"
    ADD CONSTRAINT "metodo_pago_playa_playa_id_fkey" FOREIGN KEY ("playa_id") REFERENCES "public"."playa"("playa_id");



ALTER TABLE ONLY "public"."modalidad_ocupacion_playa"
    ADD CONSTRAINT "modalidad_ocupacion_playa_playa_id_fkey" FOREIGN KEY ("playa_id") REFERENCES "public"."playa"("playa_id");



ALTER TABLE ONLY "public"."playero_invitacion"
    ADD CONSTRAINT "playero_invitacion_dueno_invitador_id_fkey" FOREIGN KEY ("dueno_invitador_id") REFERENCES "public"."usuario"("usuario_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."playero_playa"
    ADD CONSTRAINT "playero_playa_dueno_invitador_id_fkey" FOREIGN KEY ("dueno_invitador_id") REFERENCES "public"."usuario"("usuario_id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."playero_playa"
    ADD CONSTRAINT "playero_playa_playa_id_fkey" FOREIGN KEY ("playa_id") REFERENCES "public"."playa"("playa_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."playero_playa"
    ADD CONSTRAINT "playero_playa_playero_id_fkey" FOREIGN KEY ("playero_id") REFERENCES "public"."usuario"("usuario_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."plaza"
    ADD CONSTRAINT "plaza_playa_id_fkey" FOREIGN KEY ("playa_id") REFERENCES "public"."playa"("playa_id");



ALTER TABLE ONLY "public"."plaza"
    ADD CONSTRAINT "plaza_tipo_plaza_id_playa_id_fkey" FOREIGN KEY ("tipo_plaza_id", "playa_id") REFERENCES "public"."tipo_plaza"("tipo_plaza_id", "playa_id");



ALTER TABLE ONLY "public"."tarifa"
    ADD CONSTRAINT "tarifa_tipo_plaza_id_playa_id_fkey" FOREIGN KEY ("tipo_plaza_id", "playa_id") REFERENCES "public"."tipo_plaza"("tipo_plaza_id", "playa_id");



ALTER TABLE ONLY "public"."tipo_plaza"
    ADD CONSTRAINT "tipo_plaza_playa_id_fkey" FOREIGN KEY ("playa_id") REFERENCES "public"."playa"("playa_id");



ALTER TABLE ONLY "public"."tipo_vehiculo_playa"
    ADD CONSTRAINT "tipo_vehiculo_playa_playa_id_fkey" FOREIGN KEY ("playa_id") REFERENCES "public"."playa"("playa_id");



ALTER TABLE ONLY "public"."turno"
    ADD CONSTRAINT "turno_playero_playa_fkey" FOREIGN KEY ("playero_id", "playa_id") REFERENCES "public"."playero_playa"("playero_id", "playa_id") ON DELETE CASCADE;



CREATE POLICY "Los dueños pueden actualizar métodos de pago en sus playas" ON "public"."metodo_pago_playa" FOR UPDATE USING (("playa_id" IN ( SELECT "playa"."playa_id"
   FROM "public"."playa"
  WHERE ("playa"."playa_dueno_id" = "auth"."uid"()))));



CREATE POLICY "Los dueños pueden actualizar tarifas de sus playas" ON "public"."tarifa" FOR UPDATE USING (("playa_id" IN ( SELECT "playa"."playa_id"
   FROM "public"."playa"
  WHERE (("playa"."playa_dueno_id" = "auth"."uid"()) AND ("playa"."fecha_eliminacion" IS NULL))))) WITH CHECK ((("playa_id" IN ( SELECT "playa"."playa_id"
   FROM "public"."playa"
  WHERE (("playa"."playa_dueno_id" = "auth"."uid"()) AND ("playa"."fecha_eliminacion" IS NULL)))) AND ("tipo_plaza_id" IN ( SELECT "tipo_plaza"."tipo_plaza_id"
   FROM "public"."tipo_plaza"
  WHERE (("tipo_plaza"."playa_id" = "tarifa"."playa_id") AND ("tipo_plaza"."fecha_eliminacion" IS NULL))))));



CREATE POLICY "Los dueños pueden actualizar tipos de vehículo en sus playas" ON "public"."tipo_vehiculo_playa" FOR UPDATE USING (("playa_id" IN ( SELECT "playa"."playa_id"
   FROM "public"."playa"
  WHERE ("playa"."playa_dueno_id" = "auth"."uid"())))) WITH CHECK (("playa_id" IN ( SELECT "playa"."playa_id"
   FROM "public"."playa"
  WHERE ("playa"."playa_dueno_id" = "auth"."uid"()))));



CREATE POLICY "Los dueños pueden eliminar métodos de pago en sus playas" ON "public"."metodo_pago_playa" FOR DELETE USING (("playa_id" IN ( SELECT "playa"."playa_id"
   FROM "public"."playa"
  WHERE ("playa"."playa_dueno_id" = "auth"."uid"()))));



CREATE POLICY "Los dueños pueden eliminar tarifas de sus playas" ON "public"."tarifa" FOR DELETE USING (("playa_id" IN ( SELECT "playa"."playa_id"
   FROM "public"."playa"
  WHERE (("playa"."playa_dueno_id" = "auth"."uid"()) AND ("playa"."fecha_eliminacion" IS NULL)))));



CREATE POLICY "Los dueños pueden eliminar tipos de vehículo de sus playas" ON "public"."tipo_vehiculo_playa" FOR DELETE USING (("playa_id" IN ( SELECT "playa"."playa_id"
   FROM "public"."playa"
  WHERE ("playa"."playa_dueno_id" = "auth"."uid"()))));



CREATE POLICY "Los dueños pueden insertar métodos de pago en sus playas" ON "public"."metodo_pago_playa" FOR INSERT WITH CHECK (("playa_id" IN ( SELECT "playa"."playa_id"
   FROM "public"."playa"
  WHERE ("playa"."playa_dueno_id" = "auth"."uid"()))));



CREATE POLICY "Los dueños pueden insertar tarifas en sus playas" ON "public"."tarifa" FOR INSERT WITH CHECK ((("playa_id" IN ( SELECT "playa"."playa_id"
   FROM "public"."playa"
  WHERE (("playa"."playa_dueno_id" = "auth"."uid"()) AND ("playa"."fecha_eliminacion" IS NULL)))) AND ("tipo_plaza_id" IN ( SELECT "tipo_plaza"."tipo_plaza_id"
   FROM "public"."tipo_plaza"
  WHERE (("tipo_plaza"."playa_id" = "tarifa"."playa_id") AND ("tipo_plaza"."fecha_eliminacion" IS NULL))))));



CREATE POLICY "Los dueños pueden insertar tipos de vehículo en sus playas" ON "public"."tipo_vehiculo_playa" FOR INSERT WITH CHECK (("playa_id" IN ( SELECT "playa"."playa_id"
   FROM "public"."playa"
  WHERE ("playa"."playa_dueno_id" = "auth"."uid"()))));



CREATE POLICY "Los dueños pueden ver sus métodos de pago" ON "public"."metodo_pago_playa" FOR SELECT USING (("playa_id" IN ( SELECT "playa"."playa_id"
   FROM "public"."playa"
  WHERE ("playa"."playa_dueno_id" = "auth"."uid"()))));



CREATE POLICY "Los dueños pueden ver tarifas de sus playas" ON "public"."tarifa" FOR SELECT USING (("playa_id" IN ( SELECT "playa"."playa_id"
   FROM "public"."playa"
  WHERE (("playa"."playa_dueno_id" = "auth"."uid"()) AND ("playa"."fecha_eliminacion" IS NULL)))));



CREATE POLICY "Los dueños pueden ver tipos de vehículo de sus playas" ON "public"."tipo_vehiculo_playa" FOR SELECT USING (("playa_id" IN ( SELECT "playa"."playa_id"
   FROM "public"."playa"
  WHERE ("playa"."playa_dueno_id" = "auth"."uid"()))));



CREATE POLICY "Los playeros solo pueden actualizar sus propios turnos" ON "public"."turno" FOR UPDATE USING (("auth"."uid"() = "playero_id")) WITH CHECK (("auth"."uid"() = "playero_id"));



CREATE POLICY "Los playeros solo pueden insertar un turno si no tienen otro ab" ON "public"."turno" FOR INSERT WITH CHECK ((("auth"."uid"() = "playero_id") AND (NOT (EXISTS ( SELECT 1
   FROM "public"."turno" "t"
  WHERE (("t"."playero_id" = "auth"."uid"()) AND ("t"."fecha_hora_salida" IS NULL)))))));



CREATE POLICY "Los playeros solo pueden ver sus propios turnos" ON "public"."turno" FOR SELECT USING (("auth"."uid"() = "playero_id"));



CREATE POLICY "Todos pueden leer ciudades" ON "public"."ciudad" FOR SELECT USING (true);



CREATE POLICY "Users can create slot type characteristics for their own beache" ON "public"."tipo_plaza_caracteristica" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."playa"
  WHERE (("playa"."playa_id" = "tipo_plaza_caracteristica"."playa_id") AND ("playa"."playa_dueno_id" = "auth"."uid"()) AND ("playa"."fecha_eliminacion" IS NULL)))));



CREATE POLICY "Users can create slot types for their own beaches" ON "public"."tipo_plaza" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."playa"
  WHERE (("playa"."playa_id" = "tipo_plaza"."playa_id") AND ("playa"."playa_dueno_id" = "auth"."uid"()) AND ("playa"."fecha_eliminacion" IS NULL)))));



CREATE POLICY "Users can create slots for their own beaches" ON "public"."plaza" FOR INSERT WITH CHECK (((EXISTS ( SELECT 1
   FROM "public"."playa"
  WHERE (("playa"."playa_id" = "plaza"."playa_id") AND ("playa"."playa_dueno_id" = "auth"."uid"()) AND ("playa"."fecha_eliminacion" IS NULL)))) AND (EXISTS ( SELECT 1
   FROM "public"."tipo_plaza"
  WHERE (("tipo_plaza"."tipo_plaza_id" = "plaza"."tipo_plaza_id") AND ("tipo_plaza"."playa_id" = "plaza"."playa_id") AND ("tipo_plaza"."fecha_eliminacion" IS NULL))))));



CREATE POLICY "Users can delete own playa modalidades" ON "public"."modalidad_ocupacion_playa" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."playa"
  WHERE (("playa"."playa_id" = "modalidad_ocupacion_playa"."playa_id") AND ("playa"."playa_dueno_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete slot type characteristics for their own beache" ON "public"."tipo_plaza_caracteristica" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."playa"
  WHERE (("playa"."playa_id" = "tipo_plaza_caracteristica"."playa_id") AND ("playa"."playa_dueno_id" = "auth"."uid"()) AND ("playa"."fecha_eliminacion" IS NULL)))));



CREATE POLICY "Users can delete slot types for their own beaches" ON "public"."tipo_plaza" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."playa"
  WHERE (("playa"."playa_id" = "tipo_plaza"."playa_id") AND ("playa"."playa_dueno_id" = "auth"."uid"()) AND ("playa"."fecha_eliminacion" IS NULL)))));



CREATE POLICY "Users can delete slots for their own beaches" ON "public"."plaza" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."playa"
  WHERE (("playa"."playa_id" = "plaza"."playa_id") AND ("playa"."playa_dueno_id" = "auth"."uid"()) AND ("playa"."fecha_eliminacion" IS NULL)))));



CREATE POLICY "Users can insert modalidades on own playas" ON "public"."modalidad_ocupacion_playa" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."playa"
  WHERE (("playa"."playa_id" = "modalidad_ocupacion_playa"."playa_id") AND ("playa"."playa_dueno_id" = "auth"."uid"())))));



CREATE POLICY "Users can update own playa modalidades" ON "public"."modalidad_ocupacion_playa" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."playa"
  WHERE (("playa"."playa_id" = "modalidad_ocupacion_playa"."playa_id") AND ("playa"."playa_dueno_id" = "auth"."uid"())))));



CREATE POLICY "Users can update slot type characteristics for their own beache" ON "public"."tipo_plaza_caracteristica" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."playa"
  WHERE (("playa"."playa_id" = "tipo_plaza_caracteristica"."playa_id") AND ("playa"."playa_dueno_id" = "auth"."uid"()) AND ("playa"."fecha_eliminacion" IS NULL)))));



CREATE POLICY "Users can update slot types for their own beaches" ON "public"."tipo_plaza" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."playa"
  WHERE (("playa"."playa_id" = "tipo_plaza"."playa_id") AND ("playa"."playa_dueno_id" = "auth"."uid"()) AND ("playa"."fecha_eliminacion" IS NULL)))));



CREATE POLICY "Users can update slots for their own beaches" ON "public"."plaza" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."playa"
  WHERE (("playa"."playa_id" = "plaza"."playa_id") AND ("playa"."playa_dueno_id" = "auth"."uid"()) AND ("playa"."fecha_eliminacion" IS NULL))))) WITH CHECK (((EXISTS ( SELECT 1
   FROM "public"."playa"
  WHERE (("playa"."playa_id" = "plaza"."playa_id") AND ("playa"."playa_dueno_id" = "auth"."uid"()) AND ("playa"."fecha_eliminacion" IS NULL)))) AND (EXISTS ( SELECT 1
   FROM "public"."tipo_plaza"
  WHERE (("tipo_plaza"."tipo_plaza_id" = "plaza"."tipo_plaza_id") AND ("tipo_plaza"."playa_id" = "plaza"."playa_id") AND ("tipo_plaza"."fecha_eliminacion" IS NULL))))));



CREATE POLICY "Users can view own playa modalidades" ON "public"."modalidad_ocupacion_playa" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."playa"
  WHERE (("playa"."playa_id" = "modalidad_ocupacion_playa"."playa_id") AND ("playa"."playa_dueno_id" = "auth"."uid"())))));



CREATE POLICY "Users can view slot type characteristics for their own beaches" ON "public"."tipo_plaza_caracteristica" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."playa"
  WHERE (("playa"."playa_id" = "tipo_plaza_caracteristica"."playa_id") AND ("playa"."playa_dueno_id" = "auth"."uid"()) AND ("playa"."fecha_eliminacion" IS NULL)))));



CREATE POLICY "Users can view slot types for their own beaches" ON "public"."tipo_plaza" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."playa"
  WHERE (("playa"."playa_id" = "tipo_plaza"."playa_id") AND ("playa"."playa_dueno_id" = "auth"."uid"()) AND ("playa"."fecha_eliminacion" IS NULL)))));



CREATE POLICY "Users can view slots for their own beaches" ON "public"."plaza" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."playa"
  WHERE (("playa"."playa_id" = "plaza"."playa_id") AND ("playa"."playa_dueno_id" = "auth"."uid"()) AND ("playa"."fecha_eliminacion" IS NULL)))));



CREATE POLICY "Usuarios autenticados pueden crear ciudades" ON "public"."ciudad" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "all_select" ON "public"."caracteristica" FOR SELECT USING (true);



ALTER TABLE "public"."caracteristica" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ciudad" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "create_role_by_user" ON "public"."rol_usuario" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "create_user" ON "public"."usuario" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "duenos_can_manage_their_playeros" ON "public"."playero_playa" TO "authenticated" USING ((("dueno_invitador_id" = "auth"."uid"()) OR ("playero_id" = "auth"."uid"()))) WITH CHECK ((("dueno_invitador_id" = "auth"."uid"()) OR ("playero_id" = "auth"."uid"())));



CREATE POLICY "duenos_own_invitations" ON "public"."playero_invitacion" TO "authenticated" USING (("dueno_invitador_id" = "auth"."uid"())) WITH CHECK (("dueno_invitador_id" = "auth"."uid"()));



CREATE POLICY "duenos_ven_sus_playeros_invitados" ON "public"."playero_playa" TO "authenticated" USING (("dueno_invitador_id" = "auth"."uid"())) WITH CHECK (("dueno_invitador_id" = "auth"."uid"()));



ALTER TABLE "public"."metodo_pago_playa" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."modalidad_ocupacion_playa" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "owner_list" ON "public"."rol_usuario" FOR SELECT TO "authenticated" USING (("usuario_id" = "auth"."uid"()));



ALTER TABLE "public"."playa" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "playa_owner_all" ON "public"."playa" TO "authenticated" USING (("playa_dueno_id" = "auth"."uid"())) WITH CHECK (("playa_dueno_id" = "auth"."uid"()));



ALTER TABLE "public"."playero_invitacion" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."playero_playa" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "playeros_actualizan_su_estado" ON "public"."playero_playa" FOR UPDATE TO "authenticated" USING (("playero_id" = "auth"."uid"())) WITH CHECK (("playero_id" = "auth"."uid"()));



CREATE POLICY "playeros_ven_sus_playas_asignadas" ON "public"."playa" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."playero_playa" "pp"
  WHERE (("pp"."playa_id" = "playa"."playa_id") AND ("pp"."playero_id" = "auth"."uid"()) AND ("pp"."estado" = 'ACTIVO'::"public"."playero_playa_estado")))));



COMMENT ON POLICY "playeros_ven_sus_playas_asignadas" ON "public"."playa" IS 'Permite que los playeros vean las playas donde están asignados como playeros activos';



CREATE POLICY "playeros_ven_sus_propias_relaciones" ON "public"."playero_playa" FOR SELECT TO "authenticated" USING (("playero_id" = "playero_id"));



ALTER TABLE "public"."plaza" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rol_usuario" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tarifa" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tipo_plaza" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tipo_plaza_caracteristica" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tipo_vehiculo_playa" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "trigger_can_assign_role" ON "public"."rol_usuario" FOR INSERT WITH CHECK (true);



COMMENT ON POLICY "trigger_can_assign_role" ON "public"."rol_usuario" IS 'Permite al trigger handle_new_user asignar roles durante el signup';



CREATE POLICY "trigger_can_create_playero_playa" ON "public"."playero_playa" FOR INSERT WITH CHECK (true);



COMMENT ON POLICY "trigger_can_create_playero_playa" ON "public"."playero_playa" IS 'Permite al trigger handle_new_user crear relaciones playero-playa durante signup de playeros invitados';



CREATE POLICY "trigger_can_create_user" ON "public"."usuario" FOR INSERT WITH CHECK (true);



COMMENT ON POLICY "trigger_can_create_user" ON "public"."usuario" IS 'Permite al trigger handle_new_user crear usuarios durante el signup';



CREATE POLICY "trigger_can_update_invitation" ON "public"."playero_invitacion" FOR UPDATE USING (true) WITH CHECK (true);



COMMENT ON POLICY "trigger_can_update_invitation" ON "public"."playero_invitacion" IS 'Permite al trigger handle_new_user marcar invitaciones como aceptadas durante signup de playeros';



ALTER TABLE "public"."turno" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."usuario" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";
GRANT USAGE ON SCHEMA "public" TO "colaborador";



GRANT ALL ON FUNCTION "public"."_assert_usuario_tiene_rol"("p_usuario_id" integer, "p_rol" "public"."rol") TO "anon";
GRANT ALL ON FUNCTION "public"."_assert_usuario_tiene_rol"("p_usuario_id" integer, "p_rol" "public"."rol") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_assert_usuario_tiene_rol"("p_usuario_id" integer, "p_rol" "public"."rol") TO "service_role";



GRANT ALL ON FUNCTION "public"."_assert_usuario_tiene_rol"("p_usuario_id" "uuid", "p_rol" "public"."rol") TO "anon";
GRANT ALL ON FUNCTION "public"."_assert_usuario_tiene_rol"("p_usuario_id" "uuid", "p_rol" "public"."rol") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_assert_usuario_tiene_rol"("p_usuario_id" "uuid", "p_rol" "public"."rol") TO "service_role";



GRANT ALL ON FUNCTION "public"."aceptar_invitacion_playero"("p_email" "text", "p_nombre_final" "text", "p_auth_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."aceptar_invitacion_playero"("p_email" "text", "p_nombre_final" "text", "p_auth_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."aceptar_invitacion_playero"("p_email" "text", "p_nombre_final" "text", "p_auth_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."aceptar_invitacion_playero_por_token"("p_token" "text", "p_auth_user_id" "uuid", "p_nombre_final" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."aceptar_invitacion_playero_por_token"("p_token" "text", "p_auth_user_id" "uuid", "p_nombre_final" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."aceptar_invitacion_playero_por_token"("p_token" "text", "p_auth_user_id" "uuid", "p_nombre_final" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."aceptar_invitacion_sin_auth"("p_token" "text", "p_email" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."aceptar_invitacion_sin_auth"("p_token" "text", "p_email" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."aceptar_invitacion_sin_auth"("p_token" "text", "p_email" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."aceptar_invitacion_usuario_existente"("p_token" "text", "p_auth_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."aceptar_invitacion_usuario_existente"("p_token" "text", "p_auth_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."aceptar_invitacion_usuario_existente"("p_token" "text", "p_auth_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."aprobar_playero"("p_playero_id" "uuid", "p_playa_id" "uuid", "p_dueno_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."aprobar_playero"("p_playero_id" "uuid", "p_playa_id" "uuid", "p_dueno_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."aprobar_playero"("p_playero_id" "uuid", "p_playa_id" "uuid", "p_dueno_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."aprobar_todos_playeros_pendientes"("p_dueno_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."aprobar_todos_playeros_pendientes"("p_dueno_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."aprobar_todos_playeros_pendientes"("p_dueno_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."auto_asignar_dueno_como_playero"("p_playas_ids" "uuid"[], "p_dueno_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."auto_asignar_dueno_como_playero"("p_playas_ids" "uuid"[], "p_dueno_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."auto_asignar_dueno_como_playero"("p_playas_ids" "uuid"[], "p_dueno_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_duplicate_invitations"("p_email" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_duplicate_invitations"("p_email" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_duplicate_invitations"("p_email" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_orphaned_invitations"("p_dueno_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_orphaned_invitations"("p_dueno_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_orphaned_invitations"("p_dueno_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_orphaned_user"("p_email" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_orphaned_user"("p_email" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_orphaned_user"("p_email" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."crear_invitacion_playero"("p_email" "text", "p_nombre" "text", "p_playas_ids" "uuid"[], "p_dueno_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."crear_invitacion_playero"("p_email" "text", "p_nombre" "text", "p_playas_ids" "uuid"[], "p_dueno_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."crear_invitacion_playero"("p_email" "text", "p_nombre" "text", "p_playas_ids" "uuid"[], "p_dueno_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_complete_playa_setup"("playa_data" "jsonb", "tipos_plaza_data" "jsonb", "modalidades_ocupacion_data" "jsonb", "metodos_pago_data" "jsonb", "plazas_data" "jsonb", "tarifas_data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."create_complete_playa_setup"("playa_data" "jsonb", "tipos_plaza_data" "jsonb", "modalidades_ocupacion_data" "jsonb", "metodos_pago_data" "jsonb", "plazas_data" "jsonb", "tarifas_data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_complete_playa_setup"("playa_data" "jsonb", "tipos_plaza_data" "jsonb", "modalidades_ocupacion_data" "jsonb", "metodos_pago_data" "jsonb", "plazas_data" "jsonb", "tarifas_data" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_complete_playa_setup"("playa_data" "jsonb", "tipos_plaza_data" "jsonb", "modalidades_ocupacion_data" "jsonb", "metodos_pago_data" "jsonb", "plazas_data" "jsonb", "tarifas_data" "jsonb", "tipos_vehiculo_data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."create_complete_playa_setup"("playa_data" "jsonb", "tipos_plaza_data" "jsonb", "modalidades_ocupacion_data" "jsonb", "metodos_pago_data" "jsonb", "plazas_data" "jsonb", "tarifas_data" "jsonb", "tipos_vehiculo_data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_complete_playa_setup"("playa_data" "jsonb", "tipos_plaza_data" "jsonb", "modalidades_ocupacion_data" "jsonb", "metodos_pago_data" "jsonb", "plazas_data" "jsonb", "tarifas_data" "jsonb", "tipos_vehiculo_data" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_tipo_plaza_with_caracteristicas"("p_playa_id" "uuid", "p_nombre" "text", "p_descripcion" "text", "p_caracteristicas" bigint[]) TO "anon";
GRANT ALL ON FUNCTION "public"."create_tipo_plaza_with_caracteristicas"("p_playa_id" "uuid", "p_nombre" "text", "p_descripcion" "text", "p_caracteristicas" bigint[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_tipo_plaza_with_caracteristicas"("p_playa_id" "uuid", "p_nombre" "text", "p_descripcion" "text", "p_caracteristicas" bigint[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_playa"("playa_id_param" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."delete_playa"("playa_id_param" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_playa"("playa_id_param" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_plaza"("plaza_id_param" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."delete_plaza"("plaza_id_param" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_plaza"("plaza_id_param" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_tarifa"("p_playa_id" "uuid", "p_tipo_plaza_id" bigint, "p_modalidad_ocupacion" "public"."modalidad_ocupacion", "p_tipo_vehiculo" "public"."tipo_vehiculo") TO "anon";
GRANT ALL ON FUNCTION "public"."delete_tarifa"("p_playa_id" "uuid", "p_tipo_plaza_id" bigint, "p_modalidad_ocupacion" "public"."modalidad_ocupacion", "p_tipo_vehiculo" "public"."tipo_vehiculo") TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_tarifa"("p_playa_id" "uuid", "p_tipo_plaza_id" bigint, "p_modalidad_ocupacion" "public"."modalidad_ocupacion", "p_tipo_vehiculo" "public"."tipo_vehiculo") TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_tipo_plaza"("p_tipo_plaza_id" bigint, "p_playa_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."delete_tipo_plaza"("p_tipo_plaza_id" bigint, "p_playa_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_tipo_plaza"("p_tipo_plaza_id" bigint, "p_playa_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."desvincular_playero_de_playas"("p_playero_id" "uuid", "p_playas_ids" "uuid"[], "p_motivo" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."desvincular_playero_de_playas"("p_playero_id" "uuid", "p_playas_ids" "uuid"[], "p_motivo" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."desvincular_playero_de_playas"("p_playero_id" "uuid", "p_playas_ids" "uuid"[], "p_motivo" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."eliminar_invitacion_pendiente"("p_email" "text", "p_dueno_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."eliminar_invitacion_pendiente"("p_email" "text", "p_dueno_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."eliminar_invitacion_pendiente"("p_email" "text", "p_dueno_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."eliminar_invitacion_playero"("p_email" "text", "p_dueno_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."eliminar_invitacion_playero"("p_email" "text", "p_dueno_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."eliminar_invitacion_playero"("p_email" "text", "p_dueno_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."eliminar_playero"("p_playero_id" "uuid", "p_playa_id" "uuid", "p_motivo" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."eliminar_playero"("p_playero_id" "uuid", "p_playa_id" "uuid", "p_motivo" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."eliminar_playero"("p_playero_id" "uuid", "p_playa_id" "uuid", "p_motivo" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."es_playero_de_playa"("p_usuario_id" "uuid", "p_playa_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."es_playero_de_playa"("p_usuario_id" "uuid", "p_playa_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."es_playero_de_playa"("p_usuario_id" "uuid", "p_playa_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."find_orphaned_invitations"("p_dueno_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."find_orphaned_invitations"("p_dueno_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."find_orphaned_invitations"("p_dueno_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."find_orphaned_users"() TO "anon";
GRANT ALL ON FUNCTION "public"."find_orphaned_users"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."find_orphaned_users"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fix_existing_playero_to_pending"("p_playero_email" "text", "p_dueno_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."fix_existing_playero_to_pending"("p_playero_email" "text", "p_dueno_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fix_existing_playero_to_pending"("p_playero_email" "text", "p_dueno_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_authenticated_user_with_roles"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_authenticated_user_with_roles"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_authenticated_user_with_roles"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_playa_filters"("search_query" "text", "applied_filters" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."get_playa_filters"("search_query" "text", "applied_filters" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_playa_filters"("search_query" "text", "applied_filters" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_playeros_for_dueno"("p_dueno_id" "uuid", "p_search_query" "text", "p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_playeros_for_dueno"("p_dueno_id" "uuid", "p_search_query" "text", "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_playeros_for_dueno"("p_dueno_id" "uuid", "p_search_query" "text", "p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_plaza_filters"("search_query" "text", "applied_filters" "jsonb", "playa_id_param" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_plaza_filters"("search_query" "text", "applied_filters" "jsonb", "playa_id_param" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_plaza_filters"("search_query" "text", "applied_filters" "jsonb", "playa_id_param" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_tarifa_filters"("search_query" "text", "applied_filters" "jsonb", "playa_id_param" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_tarifa_filters"("search_query" "text", "applied_filters" "jsonb", "playa_id_param" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_tarifa_filters"("search_query" "text", "applied_filters" "jsonb", "playa_id_param" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_tipo_plaza_filters"("search_query" "text", "applied_filters" "jsonb", "playa_id_param" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_tipo_plaza_filters"("search_query" "text", "applied_filters" "jsonb", "playa_id_param" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_tipo_plaza_filters"("search_query" "text", "applied_filters" "jsonb", "playa_id_param" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."limpiar_invitaciones_expiradas"() TO "anon";
GRANT ALL ON FUNCTION "public"."limpiar_invitaciones_expiradas"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."limpiar_invitaciones_expiradas"() TO "service_role";



GRANT ALL ON FUNCTION "public"."limpiar_invitaciones_expiradas_email"("p_email" "text", "p_dueno_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."limpiar_invitaciones_expiradas_email"("p_email" "text", "p_dueno_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."limpiar_invitaciones_expiradas_email"("p_email" "text", "p_dueno_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."limpiar_roles_playero_huerfanos"() TO "anon";
GRANT ALL ON FUNCTION "public"."limpiar_roles_playero_huerfanos"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."limpiar_roles_playero_huerfanos"() TO "service_role";



GRANT ALL ON FUNCTION "public"."obtener_detalle_playero"("p_playero_id" "uuid", "p_dueno_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."obtener_detalle_playero"("p_playero_id" "uuid", "p_dueno_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."obtener_detalle_playero"("p_playero_id" "uuid", "p_dueno_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."obtener_detalles_invitacion"("p_email" "text", "p_dueno_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."obtener_detalles_invitacion"("p_email" "text", "p_dueno_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."obtener_detalles_invitacion"("p_email" "text", "p_dueno_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."obtener_estado_consolidado_playero"("p_playero_id" "uuid", "p_dueno_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."obtener_estado_consolidado_playero"("p_playero_id" "uuid", "p_dueno_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."obtener_estado_consolidado_playero"("p_playero_id" "uuid", "p_dueno_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."rechazar_invitacion_playero"("p_token" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."rechazar_invitacion_playero"("p_token" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."rechazar_invitacion_playero"("p_token" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."rechazar_playero"("p_playero_id" "uuid", "p_playa_id" "uuid", "p_motivo_rechazo" "text", "p_dueno_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."rechazar_playero"("p_playero_id" "uuid", "p_playa_id" "uuid", "p_motivo_rechazo" "text", "p_dueno_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."rechazar_playero"("p_playero_id" "uuid", "p_playa_id" "uuid", "p_motivo_rechazo" "text", "p_dueno_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."reenviar_invitacion_playero"("p_email" "text", "p_dueno_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."reenviar_invitacion_playero"("p_email" "text", "p_dueno_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."reenviar_invitacion_playero"("p_email" "text", "p_dueno_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_fecha_modificacion"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_fecha_modificacion"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_fecha_modificacion"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trg_playa_dueno_must_be_dueno"() TO "anon";
GRANT ALL ON FUNCTION "public"."trg_playa_dueno_must_be_dueno"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trg_playa_dueno_must_be_dueno"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trg_playero_playa_validate_dueno_access"() TO "anon";
GRANT ALL ON FUNCTION "public"."trg_playero_playa_validate_dueno_access"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trg_playero_playa_validate_dueno_access"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trg_playero_playa_validate_dueno_invitador"() TO "anon";
GRANT ALL ON FUNCTION "public"."trg_playero_playa_validate_dueno_invitador"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trg_playero_playa_validate_dueno_invitador"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trg_playeroplaya_user_must_be_playero"() TO "anon";
GRANT ALL ON FUNCTION "public"."trg_playeroplaya_user_must_be_playero"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trg_playeroplaya_user_must_be_playero"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trg_turno_user_must_be_playero_activo"() TO "anon";
GRANT ALL ON FUNCTION "public"."trg_turno_user_must_be_playero_activo"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trg_turno_user_must_be_playero_activo"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trg_update_fecha_modificacion_playero_invitacion"() TO "anon";
GRANT ALL ON FUNCTION "public"."trg_update_fecha_modificacion_playero_invitacion"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trg_update_fecha_modificacion_playero_invitacion"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trg_update_fecha_modificacion_playero_playa"() TO "anon";
GRANT ALL ON FUNCTION "public"."trg_update_fecha_modificacion_playero_playa"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trg_update_fecha_modificacion_playero_playa"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_tipo_plaza_with_caracteristicas"("p_tipo_plaza_id" integer, "p_nombre" "text", "p_descripcion" "text", "p_caracteristicas" integer[]) TO "anon";
GRANT ALL ON FUNCTION "public"."update_tipo_plaza_with_caracteristicas"("p_tipo_plaza_id" integer, "p_nombre" "text", "p_descripcion" "text", "p_caracteristicas" integer[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_tipo_plaza_with_caracteristicas"("p_tipo_plaza_id" integer, "p_nombre" "text", "p_descripcion" "text", "p_caracteristicas" integer[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."validar_token_invitacion"("p_token" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."validar_token_invitacion"("p_token" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."validar_token_invitacion"("p_token" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."verificar_dueno_es_playero"("p_dueno_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."verificar_dueno_es_playero"("p_dueno_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."verificar_dueno_es_playero"("p_dueno_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."verificar_email_existe"("p_email" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."verificar_email_existe"("p_email" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."verificar_email_existe"("p_email" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."verificar_roles_playero_huerfanos"() TO "anon";
GRANT ALL ON FUNCTION "public"."verificar_roles_playero_huerfanos"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."verificar_roles_playero_huerfanos"() TO "service_role";



GRANT ALL ON TABLE "public"."caracteristica" TO "anon";
GRANT ALL ON TABLE "public"."caracteristica" TO "authenticated";
GRANT ALL ON TABLE "public"."caracteristica" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."caracteristica" TO "colaborador";



GRANT ALL ON SEQUENCE "public"."caracteristica_caracteristica_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."caracteristica_caracteristica_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."caracteristica_caracteristica_id_seq" TO "service_role";
GRANT ALL ON SEQUENCE "public"."caracteristica_caracteristica_id_seq" TO "colaborador";



GRANT ALL ON TABLE "public"."ciudad" TO "anon";
GRANT ALL ON TABLE "public"."ciudad" TO "authenticated";
GRANT ALL ON TABLE "public"."ciudad" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."ciudad" TO "colaborador";



GRANT ALL ON TABLE "public"."metodo_pago_playa" TO "anon";
GRANT ALL ON TABLE "public"."metodo_pago_playa" TO "authenticated";
GRANT ALL ON TABLE "public"."metodo_pago_playa" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."metodo_pago_playa" TO "colaborador";



GRANT ALL ON TABLE "public"."modalidad_ocupacion_playa" TO "anon";
GRANT ALL ON TABLE "public"."modalidad_ocupacion_playa" TO "authenticated";
GRANT ALL ON TABLE "public"."modalidad_ocupacion_playa" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."modalidad_ocupacion_playa" TO "colaborador";



GRANT ALL ON TABLE "public"."playa" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."playa" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."playa" TO "colaborador";



GRANT ALL ON TABLE "public"."playa_publica" TO "anon";
GRANT ALL ON TABLE "public"."playa_publica" TO "authenticated";
GRANT ALL ON TABLE "public"."playa_publica" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."playa_publica" TO "colaborador";



GRANT ALL ON TABLE "public"."playero_invitacion" TO "anon";
GRANT ALL ON TABLE "public"."playero_invitacion" TO "authenticated";
GRANT ALL ON TABLE "public"."playero_invitacion" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."playero_invitacion" TO "colaborador";



GRANT ALL ON TABLE "public"."playero_playa" TO "anon";
GRANT ALL ON TABLE "public"."playero_playa" TO "authenticated";
GRANT ALL ON TABLE "public"."playero_playa" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."playero_playa" TO "colaborador";



GRANT ALL ON TABLE "public"."usuario" TO "anon";
GRANT ALL ON TABLE "public"."usuario" TO "authenticated";
GRANT ALL ON TABLE "public"."usuario" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."usuario" TO "colaborador";



GRANT ALL ON TABLE "public"."playeros_agrupados" TO "anon";
GRANT ALL ON TABLE "public"."playeros_agrupados" TO "authenticated";
GRANT ALL ON TABLE "public"."playeros_agrupados" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."playeros_agrupados" TO "colaborador";



GRANT ALL ON TABLE "public"."playeros_con_estado_consolidado" TO "anon";
GRANT ALL ON TABLE "public"."playeros_con_estado_consolidado" TO "authenticated";
GRANT ALL ON TABLE "public"."playeros_con_estado_consolidado" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."playeros_con_estado_consolidado" TO "colaborador";



GRANT ALL ON TABLE "public"."playeros_con_invitaciones" TO "anon";
GRANT ALL ON TABLE "public"."playeros_con_invitaciones" TO "authenticated";
GRANT ALL ON TABLE "public"."playeros_con_invitaciones" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."playeros_con_invitaciones" TO "colaborador";



GRANT ALL ON TABLE "public"."plaza" TO "anon";
GRANT ALL ON TABLE "public"."plaza" TO "authenticated";
GRANT ALL ON TABLE "public"."plaza" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."plaza" TO "colaborador";



GRANT ALL ON TABLE "public"."rol_usuario" TO "anon";
GRANT ALL ON TABLE "public"."rol_usuario" TO "authenticated";
GRANT ALL ON TABLE "public"."rol_usuario" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."rol_usuario" TO "colaborador";



GRANT ALL ON TABLE "public"."tarifa" TO "anon";
GRANT ALL ON TABLE "public"."tarifa" TO "authenticated";
GRANT ALL ON TABLE "public"."tarifa" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."tarifa" TO "colaborador";



GRANT ALL ON TABLE "public"."tipo_plaza" TO "anon";
GRANT ALL ON TABLE "public"."tipo_plaza" TO "authenticated";
GRANT ALL ON TABLE "public"."tipo_plaza" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."tipo_plaza" TO "colaborador";



GRANT ALL ON TABLE "public"."tipo_plaza_caracteristica" TO "anon";
GRANT ALL ON TABLE "public"."tipo_plaza_caracteristica" TO "authenticated";
GRANT ALL ON TABLE "public"."tipo_plaza_caracteristica" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."tipo_plaza_caracteristica" TO "colaborador";



GRANT ALL ON SEQUENCE "public"."tipo_plaza_tipo_plaza_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."tipo_plaza_tipo_plaza_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."tipo_plaza_tipo_plaza_id_seq" TO "service_role";
GRANT ALL ON SEQUENCE "public"."tipo_plaza_tipo_plaza_id_seq" TO "colaborador";



GRANT ALL ON TABLE "public"."tipo_vehiculo_playa" TO "anon";
GRANT ALL ON TABLE "public"."tipo_vehiculo_playa" TO "authenticated";
GRANT ALL ON TABLE "public"."tipo_vehiculo_playa" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."tipo_vehiculo_playa" TO "colaborador";



GRANT ALL ON TABLE "public"."turno" TO "anon";
GRANT ALL ON TABLE "public"."turno" TO "authenticated";
GRANT ALL ON TABLE "public"."turno" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."turno" TO "colaborador";



GRANT ALL ON TABLE "public"."v_plazas" TO "anon";
GRANT ALL ON TABLE "public"."v_plazas" TO "authenticated";
GRANT ALL ON TABLE "public"."v_plazas" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."v_plazas" TO "colaborador";



GRANT ALL ON TABLE "public"."v_tarifas" TO "anon";
GRANT ALL ON TABLE "public"."v_tarifas" TO "authenticated";
GRANT ALL ON TABLE "public"."v_tarifas" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."v_tarifas" TO "colaborador";



GRANT ALL ON TABLE "public"."v_user_with_roles" TO "anon";
GRANT ALL ON TABLE "public"."v_user_with_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."v_user_with_roles" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."v_user_with_roles" TO "colaborador";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "colaborador";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT SELECT,INSERT,DELETE,UPDATE ON TABLES  TO "colaborador";






RESET ALL;
