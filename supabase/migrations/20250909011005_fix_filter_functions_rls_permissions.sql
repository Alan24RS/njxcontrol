-- Arreglar permisos RLS para las funciones de filtros
-- Las funciones de filtros necesitan acceso de lectura a todas las filas para generar filtros dinámicos

-- Recrear función get_playa_filters con SECURITY DEFINER
DROP FUNCTION IF EXISTS get_playa_filters(text, jsonb);

CREATE OR REPLACE FUNCTION get_playa_filters(
    search_query text DEFAULT NULL::text, 
    applied_filters jsonb DEFAULT '{}'::jsonb
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- Ejecutar con permisos del propietario (postgres)
AS $$
DECLARE
  result JSON;
  estados_array JSON;
  ciudades_array JSON;
  where_conditions TEXT[];
  final_where TEXT;
BEGIN
  where_conditions := ARRAY['p.fecha_eliminacion IS NULL'];
  
  IF search_query IS NOT NULL AND search_query != '' THEN
    where_conditions := array_append(where_conditions, 
      format('(p.descripcion ILIKE %L OR p.direccion ILIKE %L OR p.nombre ILIKE %L)', 
        '%' || search_query || '%', 
        '%' || search_query || '%',
        '%' || search_query || '%'
      )
    );
  END IF;
  
  IF applied_filters ? 'estado' AND jsonb_array_length(applied_filters->'estado') > 0 THEN
    where_conditions := array_append(where_conditions,
      format('p.estado = ANY(ARRAY[%s]::playa_estado[])',
        (
          SELECT string_agg(quote_literal(value::text), ',')
          FROM jsonb_array_elements_text(applied_filters->'estado') AS value
        )
      )
    );
  END IF;
  
  IF applied_filters ? 'ciudad' AND jsonb_array_length(applied_filters->'ciudad') > 0 THEN
    where_conditions := array_append(where_conditions,
      format('p.ciudad_id = ANY(ARRAY[%s]::uuid[])',
        (
          SELECT string_agg(quote_literal(value::text), ',')
          FROM jsonb_array_elements_text(applied_filters->'ciudad') AS value
        )
      )
    );
  END IF;
  
  final_where := array_to_string(where_conditions, ' AND ');
  
  EXECUTE format('
    WITH filtered_playas AS (
      SELECT DISTINCT p.estado
      FROM playa p
      JOIN ciudad c ON p.ciudad_id = c.ciudad_id
      WHERE %s
    ),
    estados_with_labels AS (
      SELECT 
        estado::text as value,
        CASE 
          WHEN estado = ''BORRADOR'' THEN ''Borrador''
          WHEN estado = ''ACTIVO'' THEN ''Activo''
          WHEN estado = ''SUSPENDIDO'' THEN ''Suspendido''
          ELSE estado::text
        END as label
      FROM filtered_playas
      ORDER BY estado
    )
    SELECT COALESCE(json_agg(
      json_build_object(
        ''value'', value,
        ''label'', label
      )
    ), ''[]''::json)
    FROM estados_with_labels
  ', final_where) INTO estados_array;

  EXECUTE format('
    WITH filtered_ciudades AS (
      SELECT DISTINCT c.ciudad_id, c.nombre, c.provincia
      FROM playa p
      JOIN ciudad c ON p.ciudad_id = c.ciudad_id
      WHERE %s
    ),
    ciudades_with_labels AS (
      SELECT 
        ciudad_id::text as value,
        nombre || '', '' || provincia as label
      FROM filtered_ciudades
      ORDER BY nombre, provincia
    )
    SELECT COALESCE(json_agg(
      json_build_object(
        ''value'', value,
        ''label'', label
      )
    ), ''[]''::json)
    FROM ciudades_with_labels
  ', final_where) INTO ciudades_array;

  SELECT json_build_object(
    'estado', json_build_object(
      'title', 'Estado',
      'options', estados_array,
      'pagination', false
    ),
    'ciudad', json_build_object(
      'title', 'Ciudad',
      'options', ciudades_array,
      'pagination', false
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- Recrear función get_plaza_filters con SECURITY DEFINER
DROP FUNCTION IF EXISTS get_plaza_filters(text, jsonb, uuid);

CREATE OR REPLACE FUNCTION get_plaza_filters(
    search_query text DEFAULT NULL::text, 
    applied_filters jsonb DEFAULT '{}'::jsonb,
    playa_id_param uuid DEFAULT NULL::uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- Ejecutar con permisos del propietario (postgres)
AS $$
DECLARE
  result JSON;
  estados_array JSON;
  tipos_plaza_array JSON;
  where_conditions TEXT[];
  final_where TEXT;
BEGIN
  -- Condiciones base: plazas no eliminadas y de la playa especificada
  where_conditions := ARRAY['p.fecha_eliminacion IS NULL'];
  
  -- Filtrar por playa si se especifica
  IF playa_id_param IS NOT NULL THEN
    where_conditions := array_append(where_conditions, 
      format('p.playa_id = %L', playa_id_param)
    );
  END IF;
  
  -- Filtrar por búsqueda de texto (identificador)
  IF search_query IS NOT NULL AND search_query != '' THEN
    where_conditions := array_append(where_conditions, 
      format('p.identificador ILIKE %L', '%' || search_query || '%')
    );
  END IF;
  
  -- Aplicar filtros ya seleccionados
  IF applied_filters ? 'estado' AND jsonb_array_length(applied_filters->'estado') > 0 THEN
    where_conditions := array_append(where_conditions,
      format('p.estado = ANY(ARRAY[%s]::plaza_estado[])',
        (
          SELECT string_agg(quote_literal(value::text), ',')
          FROM jsonb_array_elements_text(applied_filters->'estado') AS value
        )
      )
    );
  END IF;
  
  IF applied_filters ? 'tipoPlaza' AND jsonb_array_length(applied_filters->'tipoPlaza') > 0 THEN
    where_conditions := array_append(where_conditions,
      format('p.tipo_plaza_id = ANY(ARRAY[%s]::integer[])',
        (
          SELECT string_agg(value::text, ',')
          FROM jsonb_array_elements_text(applied_filters->'tipoPlaza') AS value
        )
      )
    );
  END IF;
  
  final_where := array_to_string(where_conditions, ' AND ');
  
  -- Obtener estados disponibles
  EXECUTE format('
    WITH filtered_plazas AS (
      SELECT DISTINCT p.estado
      FROM plaza p
      WHERE %s
    ),
    estados_with_labels AS (
      SELECT 
        estado::text as value,
        CASE 
          WHEN estado = ''ACTIVO'' THEN ''Activo''
          WHEN estado = ''SUSPENDIDO'' THEN ''Suspendido''
          ELSE estado::text
        END as label
      FROM filtered_plazas
      ORDER BY estado
    )
    SELECT COALESCE(json_agg(
      json_build_object(
        ''value'', value,
        ''label'', label
      )
    ), ''[]''::json)
    FROM estados_with_labels
  ', final_where) INTO estados_array;

  -- Obtener tipos de plaza disponibles
  EXECUTE format('
    WITH filtered_tipos AS (
      SELECT DISTINCT tp.tipo_plaza_id, tp.nombre
      FROM plaza p
      JOIN tipo_plaza tp ON p.tipo_plaza_id = tp.tipo_plaza_id
      WHERE %s
    ),
    tipos_with_labels AS (
      SELECT 
        tipo_plaza_id::text as value,
        nombre as label
      FROM filtered_tipos
      ORDER BY nombre
    )
    SELECT COALESCE(json_agg(
      json_build_object(
        ''value'', value,
        ''label'', label
      )
    ), ''[]''::json)
    FROM tipos_with_labels
  ', final_where) INTO tipos_plaza_array;

  -- Construir resultado final
  SELECT json_build_object(
    'estado', json_build_object(
      'title', 'Estado',
      'options', estados_array,
      'pagination', false
    ),
    'tipoPlaza', json_build_object(
      'title', 'Tipo de Plaza',
      'options', tipos_plaza_array,
      'pagination', false
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- Otorgar permisos de ejecución a los roles necesarios
GRANT EXECUTE ON FUNCTION get_playa_filters(text, jsonb) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_plaza_filters(text, jsonb, uuid) TO anon, authenticated, service_role;
