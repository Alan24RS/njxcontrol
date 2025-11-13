-- =====================================================
-- MIGRACIÓN: FUNCIONES BÁSICAS Y TRIGGERS
-- =====================================================
-- Crea funciones básicas y triggers para automatización y validación

-- Función para actualizar fecha_modificacion automáticamente
CREATE OR REPLACE FUNCTION set_fecha_modificacion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_modificacion = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función de validación de roles
CREATE OR REPLACE FUNCTION _assert_usuario_tiene_rol(p_usuario_id integer, p_rol rol)
RETURNS void
LANGUAGE plpgsql
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

-- Función para manejar nuevos usuarios
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

  insert into public.usuario (usuario_id, email, nombre, telefono)
  values (NEW.id, NEW.email, nullif(v_nombre, ''), v_tel)
  on conflict (usuario_id) do update
    set email    = excluded.email,
        nombre   = excluded.nombre,
        telefono = excluded.telefono;

  insert into public.rol_usuario (usuario_id, rol)
  values (NEW.id, v_rol)
  on conflict (usuario_id, rol) do nothing;

  return NEW;
end;
$$;

-- Función de validación para dueños de playa
CREATE OR REPLACE FUNCTION trg_playa_dueno_must_be_dueno()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM public._assert_usuario_tiene_rol(NEW.playa_dueno_id::integer, 'DUENO');
  RETURN NEW;
END;
$$;

-- Función de validación para playeros (preparada para futuras tablas)
CREATE OR REPLACE FUNCTION trg_playeroplaya_user_must_be_playero()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM public._assert_usuario_tiene_rol(NEW.playero_id::integer, 'PLAYERO');
  RETURN NEW;
END;
$$;

-- Función de validación para turnos (preparada para futuras tablas)
CREATE OR REPLACE FUNCTION trg_turno_user_must_be_playero_activo()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_activo BOOLEAN;
BEGIN
  PERFORM public._assert_usuario_tiene_rol(NEW.usuario_id::integer, 'PLAYERO');

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
