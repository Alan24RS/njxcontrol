-- =====================================================
-- MIGRACIÓN: FUNCIÓN DE CONFIGURACIÓN COMPLETA DE PLAYA
-- =====================================================
-- Crea la función para configurar una playa completa con todos sus elementos

CREATE OR REPLACE FUNCTION create_complete_playa_setup(
    playa_data jsonb, 
    tipos_plaza_data jsonb, 
    modalidades_ocupacion_data jsonb, 
    metodos_pago_data jsonb, 
    plazas_data jsonb, 
    tarifas_data jsonb, 
    tipos_vehiculo_data jsonb DEFAULT '[]'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_playa_id UUID;
  current_user_id UUID;
  ciudad_id_value UUID;
  tipo_plaza_ids BIGINT[];
  tipo_plaza_record RECORD;
  modalidad_record RECORD;
  metodo_record RECORD;
  plaza_record RECORD;
  tarifa_record RECORD;
  tipo_vehiculo_record RECORD;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

  -- Buscar o crear la ciudad
  SELECT ciudad_id INTO ciudad_id_value
  FROM ciudad 
  WHERE nombre = (playa_data->>'ciudad')::TEXT 
    AND provincia = (playa_data->>'provincia')::TEXT;
  
  IF ciudad_id_value IS NULL THEN
    INSERT INTO ciudad (nombre, provincia)
    VALUES (
      (playa_data->>'ciudad')::TEXT,
      (playa_data->>'provincia')::TEXT
    )
    RETURNING ciudad_id INTO ciudad_id_value;
  END IF;

  -- Crear la playa
  INSERT INTO playa (
    playa_dueno_id, nombre, descripcion, direccion, ciudad_id, latitud, longitud, horario, estado
  ) VALUES (
    current_user_id,
    (playa_data->>'nombre')::TEXT,
    (playa_data->>'descripcion')::TEXT,
    (playa_data->>'direccion')::TEXT,
    ciudad_id_value,
    (playa_data->>'latitud')::DOUBLE PRECISION,
    (playa_data->>'longitud')::DOUBLE PRECISION,
    (playa_data->>'horario')::TEXT,
    'BORRADOR'::playa_estado
  ) RETURNING playa_id INTO new_playa_id;

  -- Crear tipos de plaza y almacenar sus IDs
  tipo_plaza_ids := ARRAY[]::BIGINT[];
  FOR tipo_plaza_record IN SELECT * FROM jsonb_array_elements(tipos_plaza_data)
  LOOP
    DECLARE
      new_tipo_plaza_id BIGINT;
      caracteristica_id BIGINT;
    BEGIN
      INSERT INTO tipo_plaza (
        playa_id, nombre, descripcion
      ) VALUES (
        new_playa_id,
        (tipo_plaza_record.value->>'nombre')::TEXT,
        (tipo_plaza_record.value->>'descripcion')::TEXT
      ) RETURNING tipo_plaza_id INTO new_tipo_plaza_id;
      
      FOR caracteristica_id IN SELECT jsonb_array_elements_text(tipo_plaza_record.value->'caracteristicas')::BIGINT
      LOOP
        INSERT INTO tipo_plaza_caracteristica (playa_id, tipo_plaza_id, caracteristica_id)
        VALUES (new_playa_id, new_tipo_plaza_id, caracteristica_id);
      END LOOP;
      
      tipo_plaza_ids := array_append(tipo_plaza_ids, new_tipo_plaza_id);
    END;
  END LOOP;

  -- Crear modalidades de ocupación
  FOR modalidad_record IN SELECT * FROM jsonb_array_elements(modalidades_ocupacion_data)
  LOOP
    INSERT INTO modalidad_ocupacion_playa (
      playa_id, modalidad_ocupacion, estado
    ) VALUES (
      new_playa_id,
      (modalidad_record.value->>'modalidad_ocupacion')::modalidad_ocupacion,
      'ACTIVO'::modalidad_ocupacion_playa_estado
    );
  END LOOP;

  -- Crear tipos de vehículo habilitados
  FOR tipo_vehiculo_record IN SELECT * FROM jsonb_array_elements_text(tipos_vehiculo_data)
  LOOP
    INSERT INTO tipo_vehiculo_playa (
      playa_id, tipo_vehiculo, estado
    ) VALUES (
      new_playa_id,
      tipo_vehiculo_record.value::tipo_vehiculo,
      'ACTIVO'::tipo_vehiculo_estado
    );
  END LOOP;

  -- Crear métodos de pago
  FOR metodo_record IN SELECT * FROM jsonb_array_elements(metodos_pago_data)
  LOOP
    INSERT INTO metodo_pago_playa (
      playa_id, metodo_pago, estado
    ) VALUES (
      new_playa_id,
      (metodo_record.value->>'metodo_pago')::metodo_pago,
      'ACTIVO'::metodo_pago_estado
    );
  END LOOP;

  -- Crear plazas individuales
  FOR plaza_record IN SELECT * FROM jsonb_array_elements(plazas_data)
  LOOP
    DECLARE
      tipo_plaza_index INTEGER;
      selected_tipo_plaza_id BIGINT;
    BEGIN
      tipo_plaza_index := (plaza_record.value->>'tipo_plaza_index')::INTEGER;
      selected_tipo_plaza_id := tipo_plaza_ids[tipo_plaza_index + 1];
      
      INSERT INTO plaza (
        playa_id, tipo_plaza_id, identificador, estado
      ) VALUES (
        new_playa_id,
        selected_tipo_plaza_id,
        (plaza_record.value->>'identificador')::TEXT,
        'ACTIVO'::plaza_estado
      );
    END;
  END LOOP;

  -- Crear tarifas
  FOR tarifa_record IN SELECT * FROM jsonb_array_elements(tarifas_data)
  LOOP
    DECLARE
      tipo_plaza_index INTEGER;
      selected_tipo_plaza_id BIGINT;
    BEGIN
      tipo_plaza_index := (tarifa_record.value->>'tipo_plaza_index')::INTEGER;
      selected_tipo_plaza_id := tipo_plaza_ids[tipo_plaza_index + 1];
      
      INSERT INTO tarifa (
        playa_id, tipo_plaza_id, modalidad_ocupacion, tipo_vehiculo, precio_base
      ) VALUES (
        new_playa_id,
        selected_tipo_plaza_id,
        (tarifa_record.value->>'modalidad_ocupacion')::modalidad_ocupacion,
        (tarifa_record.value->>'tipo_vehiculo')::tipo_vehiculo,
        (tarifa_record.value->>'precio_base')::REAL
      );
    END;
  END LOOP;

  RETURN jsonb_build_object('playa_id', new_playa_id);

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error al crear configuración completa: %', SQLERRM;
END;
$$;
