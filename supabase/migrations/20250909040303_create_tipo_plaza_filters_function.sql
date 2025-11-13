-- Función para obtener filtros dinámicos de tipos de plaza
CREATE OR REPLACE FUNCTION get_tipo_plaza_filters(
    search_query text DEFAULT NULL::text, 
    applied_filters jsonb DEFAULT '{}'::jsonb,
    playa_id_param uuid DEFAULT NULL::uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  caracteristicas_array JSON;
  where_conditions TEXT[];
  final_where TEXT;
BEGIN
  -- Condiciones base: tipos de plaza no eliminados y de la playa especificada
  where_conditions := ARRAY['tp.fecha_eliminacion IS NULL'];
  
  -- Filtrar por playa si se especifica
  IF playa_id_param IS NOT NULL THEN
    where_conditions := array_append(where_conditions, 
      format('tp.playa_id = %L', playa_id_param)
    );
  END IF;
  
  -- Filtrar por búsqueda de texto (nombre o descripción)
  IF search_query IS NOT NULL AND search_query != '' THEN
    where_conditions := array_append(where_conditions, 
      format('(tp.nombre ILIKE %L OR tp.descripcion ILIKE %L)', 
        '%' || search_query || '%', 
        '%' || search_query || '%'
      )
    );
  END IF;
  
  -- Aplicar filtros ya seleccionados por características
  IF applied_filters ? 'caracteristicas' AND jsonb_array_length(applied_filters->'caracteristicas') > 0 THEN
    where_conditions := array_append(where_conditions,
      format('EXISTS (
        SELECT 1 
        FROM tipo_plaza_caracteristica tpc 
        WHERE tpc.tipo_plaza_id = tp.tipo_plaza_id 
          AND tpc.caracteristica_id = ANY(ARRAY[%s]::integer[])
      )',
        (
          SELECT string_agg(value::text, ',')
          FROM jsonb_array_elements_text(applied_filters->'caracteristicas') AS value
        )
      )
    );
  END IF;
  
  final_where := array_to_string(where_conditions, ' AND ');
  
  -- Obtener características disponibles
  EXECUTE format('
    WITH filtered_tipos AS (
      SELECT DISTINCT tp.tipo_plaza_id
      FROM tipo_plaza tp
      WHERE %s
    ),
    caracteristicas_disponibles AS (
      SELECT DISTINCT c.caracteristica_id, c.nombre
      FROM filtered_tipos ft
      JOIN tipo_plaza_caracteristica tpc ON ft.tipo_plaza_id = tpc.tipo_plaza_id
      JOIN caracteristica c ON tpc.caracteristica_id = c.caracteristica_id
      ORDER BY c.nombre
    )
    SELECT COALESCE(json_agg(
      json_build_object(
        ''value'', caracteristica_id::text,
        ''label'', nombre
      )
    ), ''[]''::json)
    FROM caracteristicas_disponibles
  ', final_where) INTO caracteristicas_array;

  -- Construir resultado final
  SELECT json_build_object(
    'caracteristicas', json_build_object(
      'title', 'Características',
      'options', caracteristicas_array,
      'pagination', false
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- Otorgar permisos de ejecución
GRANT EXECUTE ON FUNCTION get_tipo_plaza_filters(text, jsonb, uuid) TO anon, authenticated, service_role;
