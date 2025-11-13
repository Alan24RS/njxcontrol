-- =====================================================
-- MIGRACIÓN: CORREGIR FLUJO DE INVITACIONES - APROBACIÓN MANUAL
-- =====================================================
-- Los playeros invitados deben quedar en estado PENDIENTE hasta que el dueño los apruebe manualmente

-- 1. Modificar el trigger handle_new_user para crear playeros con estado PENDIENTE
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
  v_invitacion_id uuid;
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

  -- Si es playero invitado, buscar y procesar invitación
  if v_rol = 'PLAYERO' and v_invited_by is not null then
    -- Buscar invitación pendiente por email
    SELECT invitacion_id INTO v_invitacion_id
    FROM public.playero_invitacion 
    WHERE email = NEW.email 
    AND dueno_invitador_id = v_invited_by
    AND estado = 'PENDIENTE'
    AND fecha_expiracion > now()
    LIMIT 1;
    
    IF v_invitacion_id IS NOT NULL THEN
      -- Marcar invitación como aceptada
      UPDATE public.playero_invitacion 
      SET estado = 'ACEPTADA', 
          fecha_aceptacion = now(),
          auth_user_id = NEW.id
      WHERE invitacion_id = v_invitacion_id;
      
      -- Crear relaciones playero_playa con estado PENDIENTE (requiere aprobación del dueño)
      INSERT INTO public.playero_playa (
        playero_id, 
        playa_id, 
        dueno_invitador_id,
        estado
      )
      SELECT 
        NEW.id,
        unnest(pi.playas_ids),
        pi.dueno_invitador_id,
        'PENDIENTE'::playero_playa_estado  -- CAMBIO: PENDIENTE en lugar de ACTIVO
      FROM public.playero_invitacion pi
      WHERE pi.invitacion_id = v_invitacion_id
      ON CONFLICT (playero_id, playa_id) DO NOTHING;
      
    ELSIF v_playas_ids IS NOT NULL THEN
      -- Fallback al método anterior (por compatibilidad) - también PENDIENTE
      v_playas_array := string_to_array(v_playas_ids, ',');
      
      foreach playa_id_item in array v_playas_array
      loop
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
            'PENDIENTE'::playero_playa_estado  -- CAMBIO: PENDIENTE en lugar de ACTIVO
          ) on conflict (playero_id, playa_id) do nothing;
        end if;
      end loop;
    END IF;
  end if;

  return NEW;
end;
$$;

-- 2. Función para aprobar un playero pendiente
CREATE OR REPLACE FUNCTION public.aprobar_playero(
    p_playero_id uuid,
    p_playa_id uuid,
    p_dueno_id uuid DEFAULT auth.uid()
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
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

-- 3. Función para rechazar un playero pendiente
CREATE OR REPLACE FUNCTION public.rechazar_playero(
    p_playero_id uuid,
    p_playa_id uuid,
    p_motivo_rechazo text DEFAULT 'Rechazado por el dueño',
    p_dueno_id uuid DEFAULT auth.uid()
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
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

-- 4. Función para aprobar todos los playeros pendientes de un dueño
CREATE OR REPLACE FUNCTION public.aprobar_todos_playeros_pendientes(
    p_dueno_id uuid DEFAULT auth.uid()
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
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

-- 5. Comentario sobre el cambio
COMMENT ON FUNCTION public.aprobar_playero IS 'Función para aprobar un playero que está en estado PENDIENTE y cambiar su estado a ACTIVO';
COMMENT ON FUNCTION public.rechazar_playero IS 'Función para rechazar un playero que está en estado PENDIENTE y eliminar la relación';
COMMENT ON FUNCTION public.aprobar_todos_playeros_pendientes IS 'Función para aprobar todos los playeros pendientes de un dueño de una vez';
