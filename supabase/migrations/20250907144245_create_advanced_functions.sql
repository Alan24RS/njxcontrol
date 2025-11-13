-- =====================================================
-- MIGRACIÓN: FUNCIONES AVANZADAS
-- =====================================================
-- Crea funciones avanzadas para operaciones complejas del sistema

-- Función para eliminar playa (soft/hard delete)
CREATE OR REPLACE FUNCTION delete_playa(playa_id_param uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    has_related_records BOOLEAN := FALSE;
    result JSON;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM playa 
        WHERE playa_id = playa_id_param 
        AND fecha_eliminacion IS NULL
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Playa no encontrada o ya eliminada'
        );
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM plaza 
        WHERE playa_id = playa_id_param 
        AND fecha_eliminacion IS NULL
    ) INTO has_related_records;

    IF NOT has_related_records THEN
        SELECT EXISTS (
            SELECT 1 FROM tipo_plaza 
            WHERE playa_id = playa_id_param 
            AND fecha_eliminacion IS NULL
        ) INTO has_related_records;
    END IF;

    IF NOT has_related_records THEN
        SELECT EXISTS (
            SELECT 1 FROM metodo_pago_playa 
            WHERE playa_id = playa_id_param 
            AND fecha_eliminacion IS NULL
        ) INTO has_related_records;
    END IF;

    IF NOT has_related_records THEN
        SELECT EXISTS (
            SELECT 1 FROM modalidad_ocupacion_playa 
            WHERE playa_id = playa_id_param 
            AND fecha_eliminacion IS NULL
        ) INTO has_related_records;
    END IF;

    IF NOT has_related_records THEN
        SELECT EXISTS (
            SELECT 1 FROM tipo_vehiculo_playa 
            WHERE playa_id = playa_id_param
        ) INTO has_related_records;
    END IF;

    IF NOT has_related_records THEN
        SELECT EXISTS (
            SELECT 1 FROM tarifa 
            WHERE playa_id = playa_id_param
        ) INTO has_related_records;
    END IF;

    IF has_related_records THEN
        UPDATE playa 
        SET 
            estado = 'SUSPENDIDO',
            fecha_eliminacion = NOW()
        WHERE playa_id = playa_id_param;

        result := json_build_object(
            'success', true,
            'action', 'soft_delete',
            'message', 'Playa suspendida debido a registros relacionados'
        );
    ELSE
        DELETE FROM playa WHERE playa_id = playa_id_param;

        result := json_build_object(
            'success', true,
            'action', 'hard_delete',
            'message', 'Playa eliminada completamente'
        );
    END IF;

    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

-- Función para obtener filtros dinámicos de playas
CREATE OR REPLACE FUNCTION get_playa_filters(
    search_query text DEFAULT NULL::text, 
    applied_filters jsonb DEFAULT '{}'::jsonb
)
RETURNS json
LANGUAGE plpgsql
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
