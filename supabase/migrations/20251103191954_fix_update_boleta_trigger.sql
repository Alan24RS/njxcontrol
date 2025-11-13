CREATE OR REPLACE FUNCTION public.update_boleta_monto_pagado()
RETURNS TRIGGER AS $$
DECLARE
  v_total_pagado DECIMAL(10, 2);
  v_playa_id UUID;
  v_plaza_id UUID;
  v_fecha_hora_inicio_abono TIMESTAMPTZ;
  v_fecha_generacion_boleta DATE;
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.playa_id_boleta IS NULL THEN
      RETURN OLD;
    END IF;
    v_playa_id := OLD.playa_id_boleta;
    v_plaza_id := OLD.plaza_id_boleta;
    v_fecha_hora_inicio_abono := OLD.fecha_hora_inicio_abono;
    v_fecha_generacion_boleta := OLD.fecha_generacion_boleta;
  ELSE
    IF NEW.playa_id_boleta IS NULL THEN
      RETURN NEW;
    END IF;
    v_playa_id := NEW.playa_id_boleta;
    v_plaza_id := NEW.plaza_id_boleta;
    v_fecha_hora_inicio_abono := NEW.fecha_hora_inicio_abono;
    v_fecha_generacion_boleta := NEW.fecha_generacion_boleta;
  END IF;
  
  SELECT COALESCE(SUM(monto_pago), 0)
  INTO v_total_pagado
  FROM public.pago
  WHERE playa_id_boleta = v_playa_id
    AND plaza_id_boleta = v_plaza_id
    AND fecha_hora_inicio_abono = v_fecha_hora_inicio_abono
    AND fecha_generacion_boleta = v_fecha_generacion_boleta;
  
  UPDATE public.boleta
  SET monto_pagado = v_total_pagado,
      estado = calculate_boleta_estado(monto, v_total_pagado, fecha_vencimiento_boleta)
  WHERE playa_id = v_playa_id
    AND plaza_id = v_plaza_id
    AND fecha_hora_inicio_abono = v_fecha_hora_inicio_abono
    AND fecha_generacion_boleta = v_fecha_generacion_boleta;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.update_boleta_monto_pagado IS 
  'Trigger function que actualiza automáticamente el monto_pagado y estado de una boleta cuando se insertan/actualizan/eliminan pagos asociados';

