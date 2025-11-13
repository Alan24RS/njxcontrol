-- Eliminar la función problemática y crear una nueva versión simple
DROP FUNCTION IF EXISTS update_tipo_plaza_with_caracteristicas(INTEGER, TEXT, TEXT, INTEGER[]);

-- Función simple para actualizar un tipo de plaza con sus características
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
BEGIN
  -- Obtener el playa_id del tipo de plaza
  SELECT playa_id INTO v_playa_id
  FROM tipo_plaza
  WHERE tipo_plaza_id = p_tipo_plaza_id
    AND fecha_eliminacion IS NULL;
  
  IF v_playa_id IS NULL THEN
    RAISE EXCEPTION 'Tipo de plaza no encontrado';
  END IF;

  -- Validar que todas las características existen
  IF array_length(p_caracteristicas, 1) > 0 THEN
    FOREACH v_caracteristica_id IN ARRAY p_caracteristicas
    LOOP
      IF NOT EXISTS (SELECT 1 FROM caracteristica WHERE caracteristica_id = v_caracteristica_id) THEN
        RAISE EXCEPTION 'Característica con ID % no existe', v_caracteristica_id;
      END IF;
    END LOOP;
  END IF;

  -- Actualizar el tipo de plaza
  UPDATE tipo_plaza 
  SET 
    nombre = p_nombre,
    descripcion = p_descripcion,
    fecha_modificacion = NOW()
  WHERE tipo_plaza_id = p_tipo_plaza_id;

  -- Eliminar características existentes
  DELETE FROM tipo_plaza_caracteristica 
  WHERE tipo_plaza_id = p_tipo_plaza_id;

  -- Insertar nuevas características
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
    t.tipo_plaza_id,
    t.playa_id,
    t.nombre,
    t.descripcion,
    t.fecha_creacion,
    t.fecha_modificacion
  FROM tipo_plaza t
  WHERE t.tipo_plaza_id = p_tipo_plaza_id;
  
END;
$$;
