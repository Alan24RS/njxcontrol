-- Agrega trigger para validar transiciones de estado en la tabla ocupacion.
-- Garantiza que no se pueda marcar una ocupación como FINALIZADO sin los campos requeridos.

CREATE OR REPLACE FUNCTION public.validate_ocupacion_estado_transition()
RETURNS TRIGGER AS $$
BEGIN
  -- Si se está finalizando la ocupación, validar campos requeridos
  IF NEW.estado = 'FINALIZADO'::public.ocupacion_estado THEN
    IF NEW.hora_egreso IS NULL THEN
      RAISE EXCEPTION 'OCUPACION_VALIDATION_ERROR: No se puede finalizar ocupación sin hora_egreso'
        USING HINT = 'Asegúrate de establecer hora_egreso antes de cambiar el estado a FINALIZADO';
    END IF;
    
    IF NEW.numero_pago IS NULL THEN
      RAISE EXCEPTION 'OCUPACION_VALIDATION_ERROR: No se puede finalizar ocupación sin numero_pago'
        USING HINT = 'Asegúrate de registrar el pago antes de finalizar la ocupación';
    END IF;
  END IF;
  
  -- Si se está volviendo a ACTIVO desde FINALIZADO, validar que sea permitido
  IF OLD.estado = 'FINALIZADO'::public.ocupacion_estado 
     AND NEW.estado = 'ACTIVO'::public.ocupacion_estado THEN
    RAISE EXCEPTION 'OCUPACION_VALIDATION_ERROR: No se puede reactivar una ocupación finalizada'
      USING HINT = 'Las ocupaciones finalizadas no pueden volver a estado ACTIVO';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger que se ejecuta ANTES de UPDATE
CREATE TRIGGER trg_validate_ocupacion_estado
BEFORE UPDATE OF estado ON public.ocupacion
FOR EACH ROW
WHEN (OLD.estado IS DISTINCT FROM NEW.estado)
EXECUTE FUNCTION public.validate_ocupacion_estado_transition();

COMMENT ON FUNCTION public.validate_ocupacion_estado_transition() 
IS 'Valida que las transiciones de estado en ocupacion sean correctas y que los campos requeridos estén poblados';

COMMENT ON TRIGGER trg_validate_ocupacion_estado ON public.ocupacion 
IS 'Previene transiciones inválidas de estado y garantiza integridad de datos al finalizar ocupaciones';
