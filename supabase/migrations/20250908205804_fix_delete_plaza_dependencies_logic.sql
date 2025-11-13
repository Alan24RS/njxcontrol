-- Corregir función delete_plaza para verificar dependencias reales
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
    
    -- Verificar si tiene dependencias reales (ocupaciones, turnos, reservas, etc.)
    -- Por ahora no hay tablas de ocupaciones/turnos implementadas, 
    -- por lo que siempre será eliminación física
    -- En el futuro agregar verificaciones como:
    -- SELECT EXISTS(SELECT 1 FROM ocupaciones WHERE plaza_id = plaza_id_param) 
    -- OR EXISTS(SELECT 1 FROM turnos WHERE plaza_id = plaza_id_param)
    -- OR EXISTS(SELECT 1 FROM reservas WHERE plaza_id = plaza_id_param)
    
    has_dependencies := FALSE;
    
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
            'message', 'Plaza suspendida (baja lógica debido a dependencias)',
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

