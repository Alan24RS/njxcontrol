-- =====================================================
-- MIGRACIÓN: MANEJAR INVITACIONES DE PLAYEROS
-- =====================================================
-- Modifica la función handle_new_user para manejar invitaciones de playeros

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
  v_playas_ids text := NEW.raw_user_meta_data->>'playas_asignadas';
  v_playas_array text[];
  playa_id_item text;
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

  -- Si es playero invitado, crear relaciones playero_playa
  if v_rol = 'PLAYERO' and v_invited_by is not null and v_playas_ids is not null then
    -- Convertir string separado por comas en array
    v_playas_array := string_to_array(v_playas_ids, ',');
    
    -- Crear relación para cada playa
    foreach playa_id_item in array v_playas_array
    loop
      -- Solo insertar si la playa existe y pertenece al dueño invitador
      if exists (
        select 1 from public.playa 
        where playa_id = playa_id_item::uuid 
        and playa_dueno_id = v_invited_by
      ) then
        insert into public.playero_playa (
          playero_id, 
          playa_id, 
          dueno_invitador_id,
          estado
        ) values (
          NEW.id,
          playa_id_item::uuid,
          v_invited_by,
          'ACTIVO'::playero_playa_estado
        ) on conflict (playero_id, playa_id) do nothing;
      end if;
    end loop;
  end if;

  return NEW;
end;
$$;
