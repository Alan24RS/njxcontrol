CREATE OR REPLACE FUNCTION public.get_tarifa_mensual(
  p_playa_id UUID,
  p_tipo_plaza_id BIGINT,
  p_tipo_vehiculo tipo_vehiculo
)
RETURNS DECIMAL(10, 2) AS $$
DECLARE
  v_precio DECIMAL(10, 2);
BEGIN
  SELECT precio_base
  INTO v_precio
  FROM public.tarifa
  WHERE playa_id = p_playa_id
    AND tipo_plaza_id = p_tipo_plaza_id
    AND modalidad_ocupacion = 'MENSUAL'
    AND tipo_vehiculo = p_tipo_vehiculo;
  
  RETURN v_precio;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_max_tarifa_mensual_vehiculos(
  p_playa_id UUID,
  p_tipo_plaza_id BIGINT,
  p_vehiculos JSONB
)
RETURNS DECIMAL(10, 2) AS $$
DECLARE
  v_vehiculo JSONB;
  v_precio DECIMAL(10, 2);
  v_max_precio DECIMAL(10, 2) := 0;
BEGIN
  FOR v_vehiculo IN SELECT * FROM jsonb_array_elements(p_vehiculos)
  LOOP
    SELECT get_tarifa_mensual(
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
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.get_tarifa_mensual IS 
  'Obtiene el precio de la tarifa mensual para una combinación de playa, tipo de plaza y tipo de vehículo';

COMMENT ON FUNCTION public.get_max_tarifa_mensual_vehiculos IS 
  'Calcula la tarifa mensual máxima de un array de vehículos. Retorna el precio más alto.';

