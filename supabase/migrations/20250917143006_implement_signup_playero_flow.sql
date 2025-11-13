-- =====================================================
-- MIGRACIÓN: IMPLEMENTAR FLUJO DE SIGNUP PARA PLAYEROS
-- =====================================================
-- Implementa el nuevo flujo donde los playeros hacen signup con token
-- en lugar de usar inviteUserByEmail de Supabase Auth

-- 1. Función para validar token de invitación
CREATE OR REPLACE FUNCTION public.validar_token_invitacion(
    p_token text
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_invitacion public.playero_invitacion;
    v_dueno_nombre text;
    v_playas_nombres text[];
BEGIN
    -- Buscar invitación por token (usando invitacion_id como token)
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
    
    -- Obtener nombre del dueño
    SELECT nombre INTO v_dueno_nombre
    FROM public.usuario
    WHERE usuario_id = v_invitacion.dueno_invitador_id;
    
    -- Obtener nombres de las playas
    SELECT array_agg(nombre) INTO v_playas_nombres
    FROM public.playa
    WHERE playa_id = ANY(v_invitacion.playas_ids);
    
    RETURN json_build_object(
        'success', true,
        'data', json_build_object(
            'email', v_invitacion.email,
            'nombre', v_invitacion.nombre,
            'dueno_invitador_id', v_invitacion.dueno_invitador_id,
            'dueno_nombre', v_dueno_nombre,
            'playas_ids', v_invitacion.playas_ids,
            'playas_nombres', v_playas_nombres
        )
    );
END;
$$;

-- 2. Función para aceptar invitación por token (llamada desde el trigger)
CREATE OR REPLACE FUNCTION public.aceptar_invitacion_playero_por_token(
    p_token text,
    p_auth_user_id uuid,
    p_nombre_final text
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_invitacion public.playero_invitacion;
    v_playas_count integer;
BEGIN
    -- Buscar y marcar invitación como aceptada
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
    
    -- Crear relaciones playero_playa para cada playa asignada
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
    
    RETURN json_build_object(
        'success', true,
        'message', format('Invitación aceptada. Asignado a %s playas', v_playas_count),
        'playas_asignadas', v_playas_count
    );
END;
$$;

-- 3. Actualizar trigger handle_new_user para manejar signup de playeros
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public'
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
begin
  -- Determinar rol
  if v_rol_txt in ('dueno','dueño') then
    v_rol := 'DUENO'::public.rol;
  elsif v_rol_txt = 'playero' then
    v_rol := 'PLAYERO'::public.rol;
  else
    raise exception using
      message = format('Rol inválido "%s". Debe ser DUENO o PLAYERO en metadatos (role/rol).', v_rol_txt),
      errcode = '22023';
  end if;

  -- Crear usuario en public.usuario
  insert into public.usuario (usuario_id, email, nombre, telefono)
  values (NEW.id, NEW.email, nullif(v_nombre, ''), v_tel)
  on conflict (usuario_id) do update
    set email    = excluded.email,
        nombre   = excluded.nombre,
        telefono = excluded.telefono;

  -- Asignar rol
  insert into public.rol_usuario (usuario_id, rol)
  values (NEW.id, v_rol)
  on conflict (usuario_id, rol) do nothing;

  -- Si es playero con token de invitación, procesar la invitación
  if v_rol = 'PLAYERO' and v_invitation_token is not null then
    -- Usar función RPC para aceptar invitación por token
    select public.aceptar_invitacion_playero_por_token(
      p_token := v_invitation_token,
      p_auth_user_id := NEW.id,
      p_nombre_final := v_nombre
    ) into v_accept_result;
    
    -- Log del resultado (opcional)
    if (v_accept_result->>'success')::boolean then
      raise notice 'Invitación aceptada exitosamente para usuario %: %', 
        NEW.email, v_accept_result->>'message';
    else
      raise warning 'Error al aceptar invitación para usuario %: %', 
        NEW.email, v_accept_result->>'error';
    end if;
  end if;

  return NEW;
end;
$$;

-- 4. Mejorar función crear_invitacion_playero para devolver nombres de playas
DO $$
BEGIN
    DROP FUNCTION IF EXISTS public.crear_invitacion_playero(text, text, uuid[], uuid);
END $$;

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
    v_usuario_existente uuid;
    v_ya_es_playero boolean := false;
    v_playas_nombres text[];
BEGIN
    -- Validar que el dueño existe
    IF NOT EXISTS (SELECT 1 FROM public.usuario WHERE usuario_id = p_dueno_id) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Dueño no encontrado'
        );
    END IF;
    
    -- Validar que las playas existen y pertenecen al dueño
    IF EXISTS (
        SELECT 1 FROM unnest(p_playas_ids) AS playa_id
        WHERE NOT EXISTS (
            SELECT 1 FROM public.playa p 
            WHERE p.playa_id = playa_id 
            AND p.playa_dueno_id = p_dueno_id
        )
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Una o más playas no existen o no te pertenecen'
        );
    END IF;
    
    -- Limpiar invitaciones expiradas para este email y dueño antes de crear nueva
    DELETE FROM public.playero_invitacion 
    WHERE email = p_email 
    AND dueno_invitador_id = p_dueno_id
    AND estado = 'EXPIRADA';
    
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
    
    -- Verificar si el usuario ya existe
    SELECT usuario_id INTO v_usuario_existente
    FROM public.usuario 
    WHERE email = p_email;
    
    -- Si el usuario existe, verificar si ya es playero de alguna de estas playas
    IF v_usuario_existente IS NOT NULL THEN
        SELECT EXISTS (
            SELECT 1 FROM public.playero_playa pp
            WHERE pp.playero_id = v_usuario_existente
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
    END IF;
    
    -- Obtener nombres de las playas
    SELECT array_agg(nombre) INTO v_playas_nombres
    FROM public.playa
    WHERE playa_id = ANY(p_playas_ids);
    
    -- Crear la invitación
    INSERT INTO public.playero_invitacion (
        email, nombre, dueno_invitador_id, playas_ids
    ) VALUES (
        p_email, p_nombre, p_dueno_id, p_playas_ids
    ) RETURNING invitacion_id INTO v_invitacion_id;
    
    RETURN json_build_object(
        'success', true,
        'invitacion_id', v_invitacion_id,
        'message', format('Invitación creada para %s', p_email),
        'playas_nombres', v_playas_nombres,
        'requires_email', true  -- Siempre requiere email en el nuevo flujo
    );
END;
$$;

-- 5. Comentarios sobre el nuevo flujo
COMMENT ON FUNCTION public.validar_token_invitacion IS 'Valida un token de invitación y devuelve los datos de la invitación si es válida';
COMMENT ON FUNCTION public.aceptar_invitacion_playero_por_token IS 'Acepta una invitación usando el token y crea las relaciones playero_playa';
COMMENT ON FUNCTION handle_new_user IS 'Trigger que maneja tanto signup de dueños como de playeros con token de invitación';
