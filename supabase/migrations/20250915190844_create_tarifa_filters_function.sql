-- Función para obtener filtros dinámicos de tarifas
CREATE OR REPLACE FUNCTION get_tarifa_filters(
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
  tipos_plaza_array JSON;
  modalidades_array JSON;
  tipos_vehiculo_array JSON;
  where_conditions TEXT[];
  final_where TEXT;
BEGIN
  -- Condiciones base: tarifas de la playa especificada con tipo_plaza no eliminado
  where_conditions := ARRAY['tp.fecha_eliminacion IS NULL'];
  
  -- Filtrar por playa (obligatorio para tarifas)
  IF playa_id_param IS NOT NULL THEN
    where_conditions := array_append(where_conditions, 
      format('t.playa_id = %L', playa_id_param)
    );
  ELSE
    -- Si no hay playa, retornar filtros vacíos
    SELECT json_build_object(
      'tipoPlaza', json_build_object(
        'title', 'Tipo de Plaza',
        'options', '[]'::json,
        'pagination', false
      ),
      'modalidadOcupacion', json_build_object(
        'title', 'Modalidad de Ocupación',
        'options', '[]'::json,
        'pagination', false
      ),
      'tipoVehiculo', json_build_object(
        'title', 'Tipo de Vehículo',
        'options', '[]'::json,
        'pagination', false
      )
    ) INTO result;
    RETURN result;
  END IF;
  
  -- Filtrar por búsqueda de texto
  IF search_query IS NOT NULL AND search_query != '' THEN
    where_conditions := array_append(where_conditions, 
      format('(tp.nombre ILIKE %L OR t.modalidad_ocupacion::text ILIKE %L OR t.tipo_vehiculo::text ILIKE %L)', 
        '%' || search_query || '%', 
        '%' || search_query || '%',
        '%' || search_query || '%'
      )
    );
  END IF;
  
  -- Aplicar filtros ya seleccionados por tipo de plaza
  IF applied_filters ? 'tipoPlaza' AND jsonb_array_length(applied_filters->'tipoPlaza') > 0 THEN
    where_conditions := array_append(where_conditions,
      format('t.tipo_plaza_id = ANY(ARRAY[%s]::bigint[])',
        (
          SELECT string_agg(value::text, ',')
          FROM jsonb_array_elements_text(applied_filters->'tipoPlaza') AS value
        )
      )
    );
  END IF;
  
  -- Aplicar filtros ya seleccionados por modalidad de ocupación
  IF applied_filters ? 'modalidadOcupacion' AND jsonb_array_length(applied_filters->'modalidadOcupacion') > 0 THEN
    where_conditions := array_append(where_conditions,
      format('t.modalidad_ocupacion = ANY(ARRAY[%s]::modalidad_ocupacion[])',
        (
          SELECT string_agg(format('%L', value), ',')
          FROM jsonb_array_elements_text(applied_filters->'modalidadOcupacion') AS value
        )
      )
    );
  END IF;
  
  -- Aplicar filtros ya seleccionados por tipo de vehículo
  IF applied_filters ? 'tipoVehiculo' AND jsonb_array_length(applied_filters->'tipoVehiculo') > 0 THEN
    where_conditions := array_append(where_conditions,
      format('t.tipo_vehiculo = ANY(ARRAY[%s]::tipo_vehiculo[])',
        (
          SELECT string_agg(format('%L', value), ',')
          FROM jsonb_array_elements_text(applied_filters->'tipoVehiculo') AS value
        )
      )
    );
  END IF;
  
  final_where := array_to_string(where_conditions, ' AND ');
  
  -- Obtener tipos de plaza disponibles
  EXECUTE format('
    WITH filtered_tarifas AS (
      SELECT DISTINCT t.tipo_plaza_id, tp.nombre
      FROM tarifa t
      JOIN tipo_plaza tp ON t.tipo_plaza_id = tp.tipo_plaza_id AND t.playa_id = tp.playa_id
      WHERE %s
      ORDER BY tp.nombre
    )
    SELECT COALESCE(json_agg(
      json_build_object(
        ''value'', tipo_plaza_id::text,
        ''label'', nombre
      )
    ), ''[]''::json)
    FROM filtered_tarifas
  ', final_where) INTO tipos_plaza_array;

  -- Obtener modalidades de ocupación disponibles
  EXECUTE format('
    WITH filtered_tarifas AS (
      SELECT DISTINCT t.modalidad_ocupacion
      FROM tarifa t
      JOIN tipo_plaza tp ON t.tipo_plaza_id = tp.tipo_plaza_id AND t.playa_id = tp.playa_id
      WHERE %s
    )
    SELECT COALESCE(json_agg(
      json_build_object(
        ''value'', modalidad_ocupacion::text,
        ''label'', CASE modalidad_ocupacion
          WHEN ''POR_HORA'' THEN ''Por Hora''
          WHEN ''DIARIA'' THEN ''Diaria''
          WHEN ''SEMANAL'' THEN ''Semanal''
          WHEN ''MENSUAL'' THEN ''Mensual''
          ELSE modalidad_ocupacion::text
        END
      ) ORDER BY CASE modalidad_ocupacion
        WHEN ''POR_HORA'' THEN 1
        WHEN ''DIARIA'' THEN 2
        WHEN ''SEMANAL'' THEN 3
        WHEN ''MENSUAL'' THEN 4
        ELSE 999
      END
    ), ''[]''::json)
    FROM filtered_tarifas
  ', final_where) INTO modalidades_array;

  -- Obtener tipos de vehículo disponibles
  EXECUTE format('
    WITH filtered_tarifas AS (
      SELECT DISTINCT t.tipo_vehiculo
      FROM tarifa t
      JOIN tipo_plaza tp ON t.tipo_plaza_id = tp.tipo_plaza_id AND t.playa_id = tp.playa_id
      WHERE %s
    )
    SELECT COALESCE(json_agg(
      json_build_object(
        ''value'', tipo_vehiculo::text,
        ''label'', CASE tipo_vehiculo
          WHEN ''AUTOMOVIL'' THEN ''Automóvil''
          WHEN ''MOTOCICLETA'' THEN ''Motocicleta''
          WHEN ''CAMIONETA'' THEN ''Camioneta''
          ELSE tipo_vehiculo::text
        END
      ) ORDER BY CASE tipo_vehiculo
        WHEN ''AUTOMOVIL'' THEN 1
        WHEN ''MOTOCICLETA'' THEN 2
        WHEN ''CAMIONETA'' THEN 3
        ELSE 999
      END
    ), ''[]''::json)
    FROM filtered_tarifas
  ', final_where) INTO tipos_vehiculo_array;

  -- Construir resultado final
  SELECT json_build_object(
    'tipoPlaza', json_build_object(
      'title', 'Tipo de Plaza',
      'options', tipos_plaza_array,
      'pagination', false
    ),
    'modalidadOcupacion', json_build_object(
      'title', 'Modalidad de Ocupación',
      'options', modalidades_array,
      'pagination', false
    ),
    'tipoVehiculo', json_build_object(
      'title', 'Tipo de Vehículo',
      'options', tipos_vehiculo_array,
      'pagination', false
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- Otorgar permisos de ejecución
GRANT EXECUTE ON FUNCTION get_tarifa_filters(text, jsonb, uuid) TO anon, authenticated, service_role;
