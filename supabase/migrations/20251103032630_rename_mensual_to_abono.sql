DO $$
DECLARE
  has_mensual BOOLEAN;
  has_abono BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'modalidad_ocupacion' AND e.enumlabel = 'MENSUAL'
  ) INTO has_mensual;

  SELECT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'modalidad_ocupacion' AND e.enumlabel = 'ABONO'
  ) INTO has_abono;

  IF has_abono AND NOT has_mensual THEN
    RAISE NOTICE 'ABONO ya existe y MENSUAL no existe, migración ya aplicada, saltando...';
  ELSIF has_mensual AND NOT has_abono THEN
    RAISE NOTICE 'Renombrando MENSUAL a ABONO...';
    
    DELETE FROM modalidad_ocupacion_playa WHERE modalidad_ocupacion::text = 'MENSUAL';
    DELETE FROM tarifa WHERE modalidad_ocupacion::text = 'MENSUAL';
    DELETE FROM ocupacion WHERE modalidad_ocupacion::text = 'MENSUAL';
    
    ALTER TYPE modalidad_ocupacion RENAME VALUE 'MENSUAL' TO 'ABONO';
  ELSIF NOT has_mensual AND NOT has_abono THEN
    RAISE NOTICE 'Ni MENSUAL ni ABONO existen, agregando ABONO...';
    ALTER TYPE modalidad_ocupacion ADD VALUE IF NOT EXISTS 'ABONO';
  END IF;

  DROP VIEW IF EXISTS v_modalidades_ocupacion;
  CREATE OR REPLACE VIEW v_modalidades_ocupacion AS
  SELECT 
      mop.playa_id,
      mop.modalidad_ocupacion,
      mop.estado,
      mop.fecha_creacion,
      mop.fecha_modificacion,
      CASE mop.modalidad_ocupacion
          WHEN 'POR_HORA' THEN 'Por hora'
          WHEN 'DIARIA' THEN 'Diario'
          WHEN 'SEMANAL' THEN 'Semanal'
          WHEN 'ABONO' THEN 'Abono'
      END as modalidad_label
  FROM modalidad_ocupacion_playa mop;

  DROP VIEW IF EXISTS v_tarifas;
  CREATE OR REPLACE VIEW v_tarifas AS
  SELECT 
    t.playa_id,
    t.tipo_plaza_id,
    t.modalidad_ocupacion,
    t.tipo_vehiculo,
    t.precio_base,
    t.fecha_creacion,
    t.fecha_modificacion,
    tp.nombre as tipo_plaza_nombre,
    tp.descripcion as tipo_plaza_descripcion,
    CASE t.modalidad_ocupacion
      WHEN 'POR_HORA' THEN 1
      WHEN 'DIARIA' THEN 2
      WHEN 'SEMANAL' THEN 3
      WHEN 'ABONO' THEN 4
      ELSE 999
    END as modalidad_ocupacion_order,
    CASE t.tipo_vehiculo
      WHEN 'AUTOMOVIL' THEN 1
      WHEN 'MOTOCICLETA' THEN 2
      WHEN 'CAMIONETA' THEN 3
      ELSE 999
    END as tipo_vehiculo_order
  FROM tarifa t
  LEFT JOIN tipo_plaza tp ON t.tipo_plaza_id = tp.tipo_plaza_id AND t.playa_id = tp.playa_id
  WHERE tp.fecha_eliminacion IS NULL;

  CREATE OR REPLACE FUNCTION public.get_tarifa_abono(
    p_playa_id UUID,
    p_tipo_plaza_id BIGINT,
    p_tipo_vehiculo tipo_vehiculo
  )
  RETURNS DECIMAL(10, 2) AS $func$
  DECLARE
    v_precio DECIMAL(10, 2);
  BEGIN
    SELECT precio_base
    INTO v_precio
    FROM public.tarifa
    WHERE playa_id = p_playa_id
      AND tipo_plaza_id = p_tipo_plaza_id
      AND modalidad_ocupacion = 'ABONO'
      AND tipo_vehiculo = p_tipo_vehiculo;
    
    RETURN v_precio;
  END;
  $func$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

  CREATE OR REPLACE FUNCTION public.get_max_tarifa_abono_vehiculos(
    p_playa_id UUID,
    p_tipo_plaza_id BIGINT,
    p_vehiculos JSONB
  )
  RETURNS DECIMAL(10, 2) AS $func$
  DECLARE
    v_vehiculo JSONB;
    v_precio DECIMAL(10, 2);
    v_max_precio DECIMAL(10, 2) := 0;
  BEGIN
    FOR v_vehiculo IN SELECT * FROM jsonb_array_elements(p_vehiculos)
    LOOP
      SELECT get_tarifa_abono(
        p_playa_id,
        p_tipo_plaza_id,
        (v_vehiculo->>'tipo_vehiculo')::tipo_vehiculo
      ) INTO v_precio;
      
      IF v_precio IS NOT NULL AND v_precio > v_max_precio THEN
        v_max_precio := v_precio;
      END IF;
    END LOOP;
    
    RETURN NULLIF(v_max_precio, 0);
  END;
  $func$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

  DROP FUNCTION IF EXISTS public.get_tarifa_mensual(UUID, BIGINT, tipo_vehiculo);
  DROP FUNCTION IF EXISTS public.get_max_tarifa_mensual_vehiculos(UUID, BIGINT, JSONB);

  RAISE NOTICE '✅ Migración rename MENSUAL -> ABONO completada';
END $$;

COMMENT ON TYPE modalidad_ocupacion IS 
  'Modalidades de ocupacion del sistema: POR_HORA, DIARIA, SEMANAL, ABONO. ABONO solo se usa para el sistema de abonados, requiere que la playa tenga habilitada esta modalidad.';

COMMENT ON VIEW v_modalidades_ocupacion IS 
  'Vista de modalidades de ocupacion por playa con etiquetas legibles. ABONO se gestiona exclusivamente para el sistema de abonados.';

COMMENT ON FUNCTION public.get_tarifa_abono IS 
  'Obtiene el precio de la tarifa de abono para una combinación de playa, tipo de plaza y tipo de vehículo';

COMMENT ON FUNCTION public.get_max_tarifa_abono_vehiculos IS 
  'Calcula la tarifa de abono máxima de un array de vehículos. Retorna el precio más alto.';
