-- Función para eliminar plaza con lógica física/lógica
CREATE OR REPLACE FUNCTION delete_plaza(plaza_id_param UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    plaza_exists BOOLEAN := FALSE;
    has_dependencies BOOLEAN := FALSE;
    result JSON;
BEGIN
    -- Verificar si la plaza existe y no está ya eliminada
    SELECT EXISTS(
        SELECT 1 FROM plaza 
        WHERE plaza_id = plaza_id_param 
        AND fecha_eliminacion IS NULL
    ) INTO plaza_exists;
    
    IF NOT plaza_exists THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Plaza no encontrada o ya eliminada'
        );
    END IF;
    
    -- Verificar si tiene dependencias (ocupaciones, turnos, etc.)
    -- Por ahora solo verificamos que no tenga relaciones críticas más allá de la playa
    -- En el futuro se pueden agregar más verificaciones según las tablas que se implementen
    SELECT EXISTS(
        SELECT 1 FROM tarifa 
        WHERE playa_id = (SELECT playa_id FROM plaza WHERE plaza_id = plaza_id_param)
        AND tipo_plaza_id = (SELECT tipo_plaza_id FROM plaza WHERE plaza_id = plaza_id_param)
    ) INTO has_dependencies;
    
    -- Si no tiene dependencias críticas, eliminación física
    IF NOT has_dependencies THEN
        DELETE FROM plaza WHERE plaza_id = plaza_id_param;
        
        RETURN json_build_object(
            'success', true,
            'message', 'Plaza eliminada completamente',
            'deletion_type', 'physical'
        );
    ELSE
        -- Si tiene dependencias, baja lógica
        UPDATE plaza 
        SET 
            estado = 'SUSPENDIDO',
            fecha_eliminacion = NOW(),
            fecha_modificacion = NOW()
        WHERE plaza_id = plaza_id_param;
        
        RETURN json_build_object(
            'success', true,
            'message', 'Plaza suspendida (baja lógica)',
            'deletion_type', 'logical'
        );
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Error interno: ' || SQLERRM
        );
END;
$$;
