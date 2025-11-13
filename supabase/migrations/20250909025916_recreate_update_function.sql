DROP FUNCTION IF EXISTS public.update_tipo_plaza_with_caracteristicas(integer, text, text, integer[]);

CREATE OR REPLACE FUNCTION public.update_tipo_plaza_with_caracteristicas (
  p_tipo_plaza_id integer,       -- ID del tipo de plaza a actualizar
  p_nombre text,                 -- Nombre obligatorio
  p_descripcion text,            -- Descripción opcional
  p_caracteristicas integer[]    -- Array entrante (puede ser NULL o integer[]), lo normalizamos a bigint[]
)
RETURNS TABLE (
  tipo_plaza_id integer,
  playa_id uuid,
  nombre text,
  descripcion text,
  fecha_creacion timestamptz,
  fecha_modificacion timestamptz,
  fecha_eliminacion timestamptz
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_playa_id uuid;
  v_existing_tipo_plaza_id integer;
  v_sorted_caracteristicas bigint[]; -- ahora BIGINT[] para coincidir con la columna real
  v_len integer;
BEGIN
  -- 1) Verificar existencia del tipo de plaza y obtener playa_id
  SELECT tp.playa_id
    INTO v_playa_id
  FROM public.tipo_plaza AS tp
  WHERE tp.tipo_plaza_id = p_tipo_plaza_id
    AND tp.fecha_eliminacion IS NULL;

  IF v_playa_id IS NULL THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: Tipo de plaza con ID % no encontrado o está eliminado.', p_tipo_plaza_id;
  END IF;

  -- 2) Validar nombre obligatorio (no NULL ni cadena vacía)
  IF p_nombre IS NULL OR LENGTH(TRIM(p_nombre)) = 0 THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: El nombre del tipo de plaza es obligatorio y no puede estar vacío.';
  END IF;

  -- 3) Normalizar y convertir el array entrante a BIGINT[]:
  --    - Si vienen NULL o '{}', lo convertimos a '{}'::bigint[]
  --    - También ordenamos para comparar consistentemente
  --    - Filtramos CUALQUIER valor NULL que venga en el array
  SELECT COALESCE(array_agg((x::bigint) ORDER BY x::bigint), '{}'::bigint[])::bigint[]
    INTO v_sorted_caracteristicas
  FROM unnest(COALESCE(p_caracteristicas, '{}'::integer[])) AS x
  WHERE x IS NOT NULL; -- <-- !! AQUÍ ESTÁ LA CORRECCIÓN !!

  v_len := COALESCE(array_length(v_sorted_caracteristicas, 1), 0);

  -- 4) Construir CTE con arrays (BIGINT[]) para cada tipo_plaza en la misma playa y compararlos
  WITH tp_caracts AS (
    SELECT
      t.tipo_plaza_id AS tp_id,
      COALESCE(
        array_agg(tpc.caracteristica_id::bigint ORDER BY tpc.caracteristica_id::bigint),
        '{}'::bigint[]
      )::bigint[] AS caracts
    FROM public.tipo_plaza AS t
    LEFT JOIN public.tipo_plaza_caracteristica AS tpc
      ON tpc.tipo_plaza_id = t.tipo_plaza_id
    WHERE t.playa_id = v_playa_id
      AND t.fecha_eliminacion IS NULL
    GROUP BY t.tipo_plaza_id
  )
  SELECT tp_caracts.tp_id
    INTO v_existing_tipo_plaza_id
  FROM tp_caracts
  WHERE tp_caracts.tp_id <> p_tipo_plaza_id
    AND tp_caracts.caracts = v_sorted_caracteristicas
  LIMIT 1;

  IF v_existing_tipo_plaza_id IS NOT NULL THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: Ya existe otro tipo de plaza (ID: %) con la misma combinación de características en esta playa.', v_existing_tipo_plaza_id;
  END IF;

  -- 5) Actualizar los campos del tipo de plaza (nombre obligatorio, descripcion opcional)
  UPDATE public.tipo_plaza AS trg
  SET
    nombre = TRIM(p_nombre),
    descripcion = p_descripcion, -- Considera usar NULLIF(TRIM(p_descripcion), '') si la descripción vacía debe ser NULL
    fecha_modificacion = now()
  WHERE trg.tipo_plaza_id = p_tipo_plaza_id;

  -- 6) Reemplazar las características: eliminar y reinsertar (si las hay)
  DELETE FROM public.tipo_plaza_caracteristica AS tpc_del
  WHERE tpc_del.tipo_plaza_id = p_tipo_plaza_id;

  IF v_len > 0 THEN
    INSERT INTO public.tipo_plaza_caracteristica (
      tipo_plaza_id,
      caracteristica_id,
      playa_id 
    )
    SELECT
      p_tipo_plaza_id::integer,
      unnest_elem::bigint,
      v_playa_id::uuid 
    FROM (
      SELECT unnest(v_sorted_caracteristicas) AS unnest_elem
    ) AS u;
   
  END IF;
  -- 7) Devolver el registro actualizado (casts explícitos)
  RETURN QUERY
  SELECT
    tp2.tipo_plaza_id::integer,
    tp2.playa_id::uuid,
    tp2.nombre::text,
    tp2.descripcion::text,
    tp2.fecha_creacion::timestamptz,
    tp2.fecha_modificacion::timestamptz,
    tp2.fecha_eliminacion::timestamptz
  FROM public.tipo_plaza AS tp2
  WHERE tp2.tipo_plaza_id = p_tipo_plaza_id;

END;
$$;

-- Mantener permisos si los usan
GRANT EXECUTE ON FUNCTION public.update_tipo_plaza_with_caracteristicas(integer, text, text, integer[]) TO service_role;