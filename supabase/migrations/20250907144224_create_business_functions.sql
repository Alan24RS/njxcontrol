-- =====================================================
-- MIGRACIÓN: FUNCIONES DE NEGOCIO
-- =====================================================
-- Crea funciones complejas para operaciones de negocio

-- Función para crear tipo de plaza con características
CREATE OR REPLACE FUNCTION create_tipo_plaza_with_caracteristicas(
    p_playa_id uuid, 
    p_nombre text, 
    p_descripcion text DEFAULT ''::text, 
    p_caracteristicas bigint[] DEFAULT ARRAY[]::bigint[]
)
RETURNS TABLE(
    tipo_plaza_id bigint, 
    playa_id uuid, 
    nombre text, 
    descripcion text, 
    fecha_creacion timestamp with time zone, 
    fecha_modificacion timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET row_security TO 'off'
AS $$
DECLARE
  v_tipo_plaza_id bigint;
  v_caracteristica_id bigint;
  v_existing_caracteristicas bigint[];
  v_existing_tipo_plaza_id bigint;
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM playa pl 
    WHERE pl.playa_id = p_playa_id 
      AND pl.playa_dueno_id = auth.uid() 
      AND pl.fecha_eliminacion IS NULL
  ) THEN
    RAISE EXCEPTION 'La playa con ID % no existe o no tienes permisos', p_playa_id;
  END IF;

  IF EXISTS (
    SELECT 1 
    FROM tipo_plaza tp 
    WHERE tp.playa_id = p_playa_id 
      AND LOWER(tp.nombre) = LOWER(p_nombre)
      AND tp.fecha_eliminacion IS NULL
  ) THEN
    RAISE EXCEPTION 'Ya existe un tipo de plaza con el nombre "%"', p_nombre;
  END IF;

  IF array_length(p_caracteristicas, 1) > 0 THEN
    FOREACH v_caracteristica_id IN ARRAY p_caracteristicas
    LOOP
      IF NOT EXISTS (SELECT 1 FROM caracteristica car WHERE car.caracteristica_id = v_caracteristica_id) THEN
        RAISE EXCEPTION 'La característica con ID % no existe', v_caracteristica_id;
      END IF;
    END LOOP;

    FOR v_existing_tipo_plaza_id IN 
      SELECT tp.tipo_plaza_id
      FROM tipo_plaza tp
      WHERE tp.playa_id = p_playa_id 
        AND tp.fecha_eliminacion IS NULL
    LOOP
      SELECT ARRAY(
        SELECT tpc.caracteristica_id 
        FROM tipo_plaza_caracteristica tpc 
        WHERE tpc.playa_id = p_playa_id 
          AND tpc.tipo_plaza_id = v_existing_tipo_plaza_id
        ORDER BY tpc.caracteristica_id
      ) INTO v_existing_caracteristicas;
      
      IF (SELECT ARRAY(SELECT unnest(p_caracteristicas) ORDER BY 1)) = 
         (SELECT ARRAY(SELECT unnest(v_existing_caracteristicas) ORDER BY 1)) THEN
        RAISE EXCEPTION 'Ya existe un tipo de plaza con las mismas características';
      END IF;
    END LOOP;
  ELSE
    IF EXISTS (
      SELECT 1 
      FROM tipo_plaza tp 
      WHERE tp.playa_id = p_playa_id 
        AND tp.fecha_eliminacion IS NULL
        AND NOT EXISTS (
          SELECT 1 
          FROM tipo_plaza_caracteristica tpc 
          WHERE tpc.playa_id = p_playa_id 
            AND tpc.tipo_plaza_id = tp.tipo_plaza_id
        )
    ) THEN
      RAISE EXCEPTION 'Ya existe un tipo de plaza sin características';
    END IF;
  END IF;

  INSERT INTO tipo_plaza (playa_id, nombre, descripcion)
  VALUES (p_playa_id, p_nombre, p_descripcion)
  RETURNING tipo_plaza.tipo_plaza_id INTO v_tipo_plaza_id;
  
  IF v_tipo_plaza_id IS NULL THEN
    RAISE EXCEPTION 'Error al crear el tipo de plaza';
  END IF;
  
  IF array_length(p_caracteristicas, 1) > 0 THEN
    FOREACH v_caracteristica_id IN ARRAY p_caracteristicas
    LOOP
      INSERT INTO tipo_plaza_caracteristica (playa_id, tipo_plaza_id, caracteristica_id)
      VALUES (p_playa_id, v_tipo_plaza_id, v_caracteristica_id);
    END LOOP;
  END IF;
  
  RETURN QUERY
  SELECT 
    tp.tipo_plaza_id,
    tp.playa_id,
    tp.nombre,
    tp.descripcion,
    tp.fecha_creacion,
    tp.fecha_modificacion
  FROM tipo_plaza tp
  WHERE tp.tipo_plaza_id = v_tipo_plaza_id AND tp.playa_id = p_playa_id;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error al crear tipo de plaza: %', SQLERRM;
END;
$$;
