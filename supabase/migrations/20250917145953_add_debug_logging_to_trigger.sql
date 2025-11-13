-- =====================================================
-- MIGRACIÓN: AGREGAR LOGGING DE DEBUG AL TRIGGER
-- =====================================================
-- Agrega logging detallado al trigger handle_new_user para diagnosticar errores

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
