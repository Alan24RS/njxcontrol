-- Corregir la ambigüedad en la función para actualizar un tipo de plaza
DROP FUNCTION IF EXISTS public.update_tipo_plaza_with_caracteristicas(integer, text, text, integer[]);

CREATE OR REPLACE FUNCTION update_tipo_plaza_with_caracteristicas(
  p_tipo_plaza_id INTEGER,
  p_nombre TEXT,
  p_descripcion TEXT DEFAULT '',
  p_caracteristicas INTEGER[] DEFAULT '{}'::INTEGER[]
)
RETURNS TABLE (
  tipo_plaza_id INTEGER,
  playa_id UUID,
  nombre TEXT,
  descripcion TEXT,
  fecha_creacion TIMESTAMPTZ,
  fecha_modificacion TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_playa_id UUID;
  v_caracteristica_id INTEGER;
  v_existing_caracteristicas INTEGER[];
BEGIN
  -- Verificar que el tipo de plaza existe y obtener el playa_id
  SELECT tp.playa_id INTO v_playa_id
  FROM tipo_plaza tp
  WHERE tp.tipo_plaza_id = p_tipo_plaza_id
    AND tp.fecha_eliminacion IS NULL;
  
  IF v_playa_id IS NULL THEN
    RAISE EXCEPTION 'Tipo de plaza no encontrado o eliminado';
  END IF;

  -- Verificar que no existe otro tipo de plaza con el mismo nombre en la misma playa
  IF EXISTS (
    SELECT 1 
    FROM tipo_plaza tp 
    WHERE tp.playa_id = v_playa_id 
      AND tp.nombre = p_nombre
      AND tp.tipo_plaza_id != p_tipo_plaza_id
      AND tp.fecha_eliminacion IS NULL
  ) THEN
    RAISE EXCEPTION 'Ya existe un tipo de plaza con ese nombre en esta playa';
  END IF;

  -- Validar características si se proporcionan
  IF array_length(p_caracteristicas, 1) > 0 THEN
    -- Verificar que todas las características existen
    FOR v_caracteristica_id IN SELECT unnest(p_caracteristicas)
    LOOP
      IF NOT EXISTS (
        SELECT 1 
        FROM caracteristica c 
        WHERE c.caracteristica_id = v_caracteristica_id
      ) THEN
        RAISE EXCEPTION 'Característica con ID % no existe', v_caracteristica_id;
      END IF;
    END LOOP;

    -- Obtener características existentes de otros tipos de plaza y compararlas
    FOR v_existing_caracteristicas IN 
      SELECT array_agg(tpc.caracteristica_id ORDER BY tpc.caracteristica_id)
      FROM tipo_plaza tp 
      LEFT JOIN tipo_plaza_caracteristica tpc ON tp.tipo_plaza_id = tpc.tipo_plaza_id AND tp.playa_id = tpc.playa_id
      WHERE tp.playa_id = v_playa_id 
        AND tp.tipo_plaza_id != p_tipo_plaza_id
        AND tp.fecha_eliminacion IS NULL
      GROUP BY tp.tipo_plaza_id
    LOOP
      -- Comparar arrays ordenados
      IF v_existing_caracteristicas = (
        SELECT array_agg(unnest ORDER BY unnest) 
        FROM unnest(p_caracteristicas)
      ) THEN
        RAISE EXCEPTION 'Ya existe un tipo de plaza con esas características';
      END IF;
    END LOOP;
  ELSE
    -- Si no hay características, verificar que no existe otro tipo sin características
    IF EXISTS (
      SELECT 1 
      FROM tipo_plaza tp 
      WHERE tp.playa_id = v_playa_id 
        AND tp.tipo_plaza_id != p_tipo_plaza_id
        AND tp.fecha_eliminacion IS NULL
        AND NOT EXISTS (
          SELECT 1 
          FROM tipo_plaza_caracteristica tpc 
          WHERE tpc.playa_id = v_playa_id 
            AND tpc.tipo_plaza_id = tp.tipo_plaza_id
        )
    ) THEN
      RAISE EXCEPTION 'Ya existe un tipo de plaza sin características';
    END IF;
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
  WHERE playa_id = v_playa_id 
    AND tipo_plaza_id = p_tipo_plaza_id;

  -- Insertar nuevas características si se proporcionan
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
    tp.tipo_plaza_id,
    tp.playa_id,
    tp.nombre,
    tp.descripcion,
    tp.fecha_creacion,
    tp.fecha_modificacion
  FROM tipo_plaza tp
  WHERE tp.tipo_plaza_id = p_tipo_plaza_id AND tp.playa_id = v_playa_id;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error al actualizar tipo de plaza: %', SQLERRM;
END;
$$;
