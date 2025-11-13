-- Eliminar la función anterior con tipos incorrectos
DROP FUNCTION IF EXISTS public.delete_tarifa(uuid, integer, integer, integer);

-- Recrear la función con los tipos correctos
CREATE OR REPLACE FUNCTION delete_tarifa(
  p_playa_id UUID,
  p_tipo_plaza_id BIGINT,
  p_modalidad_ocupacion modalidad_ocupacion,
  p_tipo_vehiculo tipo_vehiculo
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
BEGIN
  -- Eliminar la tarifa directamente
  DELETE FROM tarifa 
  WHERE playa_id = p_playa_id 
    AND tipo_plaza_id = p_tipo_plaza_id 
    AND modalidad_ocupacion = p_modalidad_ocupacion 
    AND tipo_vehiculo = p_tipo_vehiculo;

  -- Verificar si se eliminó alguna fila
  IF FOUND THEN
    v_result := json_build_object(
      'success', true,
      'message', 'Tarifa eliminada correctamente'
    );
  ELSE
    v_result := json_build_object(
      'success', false,
      'error', 'No se encontró la tarifa especificada'
    );
  END IF;

  RETURN v_result;
END;
$$;
