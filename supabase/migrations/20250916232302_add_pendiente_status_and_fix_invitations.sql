-- =====================================================
-- MIGRACIÓN: MEJORAR INVITACIONES
-- =====================================================
-- Mejora el flujo de invitaciones (el estado PENDIENTE ya fue agregado en migración anterior)

-- 1. Crear tabla para invitaciones pendientes
CREATE TABLE IF NOT EXISTS public.playero_invitacion (
    invitacion_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text NOT NULL,
    nombre text NOT NULL,
    dueno_invitador_id uuid NOT NULL REFERENCES public.usuario(usuario_id) ON DELETE CASCADE,
    playas_ids uuid[] NOT NULL,
    estado text NOT NULL DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'ACEPTADA', 'EXPIRADA')),
    fecha_invitacion timestamptz NOT NULL DEFAULT now(),
    fecha_expiracion timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
    fecha_aceptacion timestamptz,
    auth_user_id uuid, -- Se llena cuando el usuario acepta la invitación
    
    -- Constraints
    CONSTRAINT unique_email_dueno_pending UNIQUE (email, dueno_invitador_id) DEFERRABLE INITIALLY DEFERRED,
    
    -- Índices
    CONSTRAINT idx_playero_invitacion_email_estado UNIQUE (email, estado) DEFERRABLE INITIALLY DEFERRED
);

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_playero_invitacion_dueno ON public.playero_invitacion(dueno_invitador_id);
CREATE INDEX IF NOT EXISTS idx_playero_invitacion_estado ON public.playero_invitacion(estado);
CREATE INDEX IF NOT EXISTS idx_playero_invitacion_fecha_exp ON public.playero_invitacion(fecha_expiracion);

-- 2. Habilitar RLS en la tabla de invitaciones
ALTER TABLE public.playero_invitacion ENABLE ROW LEVEL SECURITY;

-- Política para que los dueños vean solo sus invitaciones
CREATE POLICY "duenos_own_invitations" ON public.playero_invitacion
    FOR ALL TO authenticated
    USING (dueno_invitador_id = auth.uid())
    WITH CHECK (dueno_invitador_id = auth.uid());

-- 3. Crear vista para mostrar playeros (incluyendo invitaciones pendientes)
CREATE OR REPLACE VIEW public.playeros_con_invitaciones AS
SELECT 
    -- Datos del playero existente
    pp.playero_id,
    pp.playa_id,
    pp.dueno_invitador_id,
    pp.estado,
    pp.fecha_alta,
    pp.fecha_baja,
    pp.motivo_baja,
    pp.fecha_creacion,
    pp.fecha_modificacion,
    u.usuario_id,
    u.email,
    u.nombre,
    u.telefono,
    'REGISTRADO' as tipo_registro
FROM public.playero_playa pp
JOIN public.usuario u ON pp.playero_id = u.usuario_id

UNION ALL

-- Invitaciones pendientes (mostrar como playeros PENDIENTES)
SELECT 
    null::uuid as playero_id,
    unnest(pi.playas_ids) as playa_id,
    pi.dueno_invitador_id,
    'PENDIENTE'::playero_playa_estado as estado,
    null::timestamptz as fecha_alta,
    null::timestamptz as fecha_baja,
    null::text as motivo_baja,
    pi.fecha_invitacion as fecha_creacion,
    pi.fecha_invitacion as fecha_modificacion,
    null::uuid as usuario_id,
    pi.email,
    pi.nombre,
    null::text as telefono,
    'INVITACION_PENDIENTE' as tipo_registro
FROM public.playero_invitacion pi
WHERE pi.estado = 'PENDIENTE' 
AND pi.fecha_expiracion > now();

-- 4. Función para crear invitación de playero
DO $$
BEGIN
    DROP FUNCTION IF EXISTS public.crear_invitacion_playero(text, text, uuid[], uuid);
END $$;

CREATE OR REPLACE FUNCTION public.crear_invitacion_playero(
    p_email text,
    p_nombre text,
    p_playas_ids uuid[],
    p_dueno_id uuid
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_invitacion_id uuid;
BEGIN
    -- Verificar que el dueño existe
    IF NOT EXISTS (
        SELECT 1 FROM public.usuario u
        JOIN public.rol_usuario ru ON u.usuario_id = ru.usuario_id
        WHERE u.usuario_id = p_dueno_id AND ru.rol = 'DUENO'
    ) THEN
        RAISE EXCEPTION 'El usuario no es un dueño válido';
    END IF;
    
    -- Verificar que todas las playas pertenecen al dueño
    IF EXISTS (
        SELECT 1 FROM unnest(p_playas_ids) as playa_id
        WHERE NOT EXISTS (
            SELECT 1 FROM public.playa p 
            WHERE p.playa_id = playa_id AND p.playa_dueno_id = p_dueno_id
        )
    ) THEN
        RAISE EXCEPTION 'Una o más playas no pertenecen al dueño';
    END IF;
    
    -- Verificar que no existe una invitación pendiente para este email y dueño
    IF EXISTS (
        SELECT 1 FROM public.playero_invitacion 
        WHERE email = p_email 
        AND dueno_invitador_id = p_dueno_id 
        AND estado = 'PENDIENTE'
        AND fecha_expiracion > now()
    ) THEN
        RAISE EXCEPTION 'Ya existe una invitación pendiente para este email';
    END IF;
    
    -- Verificar que el email no está ya registrado como playero en alguna de estas playas
    IF EXISTS (
        SELECT 1 FROM public.playero_playa pp
        JOIN public.usuario u ON pp.playero_id = u.usuario_id
        WHERE u.email = p_email 
        AND pp.playa_id = ANY(p_playas_ids)
        AND pp.dueno_invitador_id = p_dueno_id
    ) THEN
        RAISE EXCEPTION 'El email ya está registrado como playero en una de las playas';
    END IF;
    
    -- Crear la invitación
    INSERT INTO public.playero_invitacion (
        email, nombre, dueno_invitador_id, playas_ids
    ) VALUES (
        p_email, p_nombre, p_dueno_id, p_playas_ids
    ) RETURNING invitacion_id INTO v_invitacion_id;
    
    RETURN v_invitacion_id;
END;
$$;

-- 5. Modificar la función handle_new_user para manejar invitaciones
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
      
      -- Crear relaciones playero_playa para cada playa de la invitación
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
        'ACTIVO'::playero_playa_estado
      FROM public.playero_invitacion pi
      WHERE pi.invitacion_id = v_invitacion_id
      ON CONFLICT (playero_id, playa_id) DO NOTHING;
      
    ELSIF v_playas_ids IS NOT NULL THEN
      -- Fallback al método anterior (por compatibilidad)
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
            'ACTIVO'::playero_playa_estado
          ) on conflict (playero_id, playa_id) do nothing;
        end if;
      end loop;
    END IF;
  end if;

  return NEW;
end;
$$;

-- 6. Función para limpiar invitaciones expiradas (ejecutar periódicamente)
DROP FUNCTION IF EXISTS public.limpiar_invitaciones_expiradas();

CREATE OR REPLACE FUNCTION public.limpiar_invitaciones_expiradas()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count integer;
BEGIN
    UPDATE public.playero_invitacion 
    SET estado = 'EXPIRADA'
    WHERE estado = 'PENDIENTE' 
    AND fecha_expiracion <= now();
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;
