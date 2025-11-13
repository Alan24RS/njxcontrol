-- =====================================================
-- MIGRACIÓN: LIMPIAR USUARIOS HUÉRFANOS
-- =====================================================
-- Función para limpiar usuarios que existen en public.usuario pero no en auth.users

-- 1. Función para limpiar un usuario huérfano específico
CREATE OR REPLACE FUNCTION public.cleanup_orphaned_user(
    p_email text
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_usuario_id uuid;
    v_auth_exists boolean;
    v_deleted_relations integer := 0;
    v_deleted_roles integer := 0;
    v_deleted_user boolean := false;
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

-- 2. Función para encontrar todos los usuarios huérfanos
CREATE OR REPLACE FUNCTION public.find_orphaned_users()
RETURNS TABLE(
    usuario_id uuid,
    email text,
    nombre text,
    has_auth_user boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
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

-- 3. Mejorar el trigger para manejar usuarios existentes
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

-- 4. Comentarios
COMMENT ON FUNCTION public.cleanup_orphaned_user IS 'Limpia un usuario específico que existe en public.usuario pero no en auth.users';
COMMENT ON FUNCTION public.find_orphaned_users IS 'Encuentra todos los usuarios huérfanos en el sistema';
