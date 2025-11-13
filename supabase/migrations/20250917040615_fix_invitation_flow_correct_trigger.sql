-- =====================================================
-- MIGRACIÓN: CORREGIR FLUJO DE INVITACIONES - TRIGGER CORRECTO
-- =====================================================
-- El trigger handle_new_user NO debe crear relaciones playero_playa automáticamente
-- Solo debe crear el usuario y asignar rol. Las relaciones se crean cuando completa el formulario.

-- 1. Modificar el trigger handle_new_user para NO crear relaciones automáticamente
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public'
AS $$
declare
  v_nombre  text := coalesce(NEW.raw_user_meta_data->>'name',
                             NEW.raw_user_meta_data->>'nombre', '');
  v_tel     text := coalesce(NEW.raw_user_meta_data->>'phone',
                             NEW.raw_user_meta_data->>'telefono', null);
  v_rol_txt text := lower(trim(both from coalesce(NEW.raw_user_meta_data->>'role',
                                                  NEW.raw_user_meta_data->>'rol', '')));
  v_rol     public.rol;
  v_invited_by uuid := (NEW.raw_user_meta_data->>'invited_by')::uuid;
begin
  if v_rol_txt in ('dueno','dueño') then
    v_rol := 'DUENO'::public.rol;
  elsif v_rol_txt = 'playero' then
    v_rol := 'PLAYERO'::public.rol;
  else
    raise exception using
      message = format('Rol invalido "%s". Debe ser DUENO o PLAYERO en metadatos (role/rol).', v_rol_txt),
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

  -- IMPORTANTE: NO crear relaciones playero_playa aquí
  -- Las relaciones se crearán cuando el usuario complete el formulario de registro
  -- usando la función aceptar_invitacion_playero

  return NEW;
end;
$$;

-- 2. Crear función para eliminar invitaciones (para que el dueño pueda cancelar invitaciones)
CREATE OR REPLACE FUNCTION public.eliminar_invitacion_playero(
    p_email text,
    p_dueno_id uuid DEFAULT auth.uid()
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
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

-- 3. Comentarios sobre el flujo correcto
COMMENT ON FUNCTION handle_new_user IS 'Trigger que se ejecuta cuando un usuario acepta la invitación por email. Solo crea el usuario y asigna rol, NO crea relaciones playero_playa';
COMMENT ON FUNCTION public.aceptar_invitacion_playero IS 'Función que se ejecuta cuando el usuario completa el formulario de registro. Crea las relaciones playero_playa con estado ACTIVO';
COMMENT ON FUNCTION public.eliminar_invitacion_playero IS 'Permite al dueño eliminar una invitación pendiente';
