DO $$
DECLARE
  has_mensual BOOLEAN;
  has_abono BOOLEAN;
  mensual_usage_count INTEGER;
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

  RAISE NOTICE 'Estado actual - MENSUAL existe: %, ABONO existe: %', has_mensual, has_abono;

  IF has_mensual THEN
    BEGIN
      SELECT COUNT(*)
      INTO mensual_usage_count
      FROM ocupacion
      WHERE modalidad_ocupacion::text = 'MENSUAL';
      
      RAISE NOTICE 'Registros encontrados con modalidad MENSUAL: %', mensual_usage_count;
      
      IF mensual_usage_count > 0 THEN
        RAISE WARNING 'LIMPIEZA: Se encontraron % registros con modalidad MENSUAL. Se eliminarán para permitir la migración.', mensual_usage_count;
        DELETE FROM ocupacion WHERE modalidad_ocupacion::text = 'MENSUAL';
      END IF;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'No se pudieron contar registros con MENSUAL, continuando...';
    END;

    DELETE FROM modalidad_ocupacion_playa WHERE modalidad_ocupacion::text = 'MENSUAL';
    DELETE FROM tarifa WHERE modalidad_ocupacion::text = 'MENSUAL';
    
    IF NOT has_abono THEN
      RAISE NOTICE 'Renombrando MENSUAL a ABONO...';
      ALTER TYPE modalidad_ocupacion RENAME VALUE 'MENSUAL' TO 'ABONO';
    ELSE
      RAISE WARNING 'MENSUAL y ABONO coexisten, esto no debería pasar. Se requiere intervención manual.';
    END IF;
  ELSIF NOT has_abono THEN
    RAISE NOTICE 'Agregando valor ABONO al enum...';
    ALTER TYPE modalidad_ocupacion ADD VALUE IF NOT EXISTS 'ABONO';
  ELSE
    RAISE NOTICE 'ABONO ya existe, no se requiere acción.';
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

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'get_tarifa_abono'
  ) THEN
    CREATE FUNCTION public.get_tarifa_abono(
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
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'get_max_tarifa_abono_vehiculos'
  ) THEN
    CREATE FUNCTION public.get_max_tarifa_abono_vehiculos(
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
  END IF;

  DROP FUNCTION IF EXISTS public.get_tarifa_mensual(UUID, BIGINT, tipo_vehiculo);
  DROP FUNCTION IF EXISTS public.get_max_tarifa_mensual_vehiculos(UUID, BIGINT, JSONB);

  RAISE NOTICE '✅ Hotfix completado exitosamente';
END $$;

COMMENT ON TYPE modalidad_ocupacion IS 
  'Modalidades de ocupacion del sistema: POR_HORA, DIARIA, SEMANAL, ABONO. ABONO solo se usa para el sistema de abonados, requiere que la playa tenga habilitada esta modalidad.';

COMMENT ON VIEW v_modalidades_ocupacion IS 
  'Vista de modalidades de ocupacion por playa con etiquetas legibles. ABONO se gestiona exclusivamente para el sistema de abonados.';

