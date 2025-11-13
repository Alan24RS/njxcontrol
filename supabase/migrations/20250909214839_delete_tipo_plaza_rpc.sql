-- RPC para eliminar tipo de plaza con lógica soft/hard delete
-- Si el tipo de plaza está siendo usado en tarifas o plazas, se hace soft delete
-- Si no está siendo usado, se elimina completamente junto con sus características

CREATE OR REPLACE FUNCTION delete_tipo_plaza(
  p_tipo_plaza_id BIGINT,
  p_playa_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tarifa_count INTEGER;
  v_plaza_count INTEGER;
  v_result JSON;
BEGIN
  -- Verificar que el tipo de plaza existe y no está eliminado
  IF NOT EXISTS (
    SELECT 1 FROM tipo_plaza 
    WHERE tipo_plaza_id = p_tipo_plaza_id 
      AND playa_id = p_playa_id 
      AND fecha_eliminacion IS NULL
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Tipo de plaza no encontrado o ya eliminado'
    );
  END IF;

  -- Verificar si el tipo de plaza está siendo usado en tarifas
  SELECT COUNT(*) INTO v_tarifa_count
  FROM tarifa 
  WHERE tipo_plaza_id = p_tipo_plaza_id 
    AND playa_id = p_playa_id;

  -- Verificar si el tipo de plaza está siendo usado en plazas
  SELECT COUNT(*) INTO v_plaza_count
  FROM plaza 
  WHERE tipo_plaza_id = p_tipo_plaza_id 
    AND playa_id = p_playa_id 
    AND fecha_eliminacion IS NULL;

  -- Si está siendo usado, hacer soft delete
  IF v_tarifa_count > 0 OR v_plaza_count > 0 THEN
    UPDATE tipo_plaza 
    SET 
      fecha_eliminacion = NOW(),
      fecha_modificacion = NOW()
    WHERE tipo_plaza_id = p_tipo_plaza_id 
      AND playa_id = p_playa_id;

    v_result := json_build_object(
      'success', true,
      'type', 'soft_delete',
      'message', 'Tipo de plaza marcado como eliminado (soft delete) porque está siendo usado en tarifas o plazas'
    );
  ELSE
    -- Si no está siendo usado, eliminar completamente
    -- Primero eliminar las características asociadas
    DELETE FROM tipo_plaza_caracteristica 
    WHERE tipo_plaza_id = p_tipo_plaza_id 
      AND playa_id = p_playa_id;

    -- Luego eliminar el tipo de plaza
    DELETE FROM tipo_plaza 
    WHERE tipo_plaza_id = p_tipo_plaza_id 
      AND playa_id = p_playa_id;

    v_result := json_build_object(
      'success', true,
      'type', 'hard_delete',
      'message', 'Tipo de plaza eliminado completamente junto con sus características'
    );
  END IF;

  RETURN v_result;
END;
$$;
