DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'boleta' 
    AND column_name = 'fecha_pago'
  ) THEN
    ALTER TABLE public.boleta DROP COLUMN fecha_pago;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'boleta' 
    AND column_name = 'numero_de_pago'
  ) THEN
    ALTER TABLE public.boleta DROP COLUMN numero_de_pago;
  END IF;
END $$;

DO $$
BEGIN
  CREATE TYPE boleta_estado AS ENUM ('PENDIENTE', 'PAGADA', 'VENCIDA');
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'boleta' 
    AND column_name = 'monto_pagado'
  ) THEN
    ALTER TABLE public.boleta 
    ADD COLUMN monto_pagado DECIMAL(10, 2) NOT NULL DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'boleta' 
    AND column_name = 'estado'
  ) THEN
    ALTER TABLE public.boleta 
    ADD COLUMN estado boleta_estado;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.calculate_boleta_estado(
  p_monto DECIMAL,
  p_monto_pagado DECIMAL,
  p_fecha_vencimiento DATE
) RETURNS boleta_estado AS $$
BEGIN
  IF p_monto_pagado >= p_monto THEN
    RETURN 'PAGADA'::boleta_estado;
  ELSIF CURRENT_DATE > p_fecha_vencimiento THEN
    RETURN 'VENCIDA'::boleta_estado;
  ELSE
    RETURN 'PENDIENTE'::boleta_estado;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION public.update_boleta_monto_pagado()
RETURNS TRIGGER AS $$
DECLARE
  v_total_pagado DECIMAL(10, 2);
  v_boleta RECORD;
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.playa_id_boleta IS NULL THEN
      RETURN OLD;
    END IF;
    v_boleta.playa_id := OLD.playa_id_boleta;
    v_boleta.plaza_id := OLD.plaza_id_boleta;
    v_boleta.fecha_hora_inicio_abono := OLD.fecha_hora_inicio_abono;
    v_boleta.fecha_generacion_boleta := OLD.fecha_generacion_boleta;
  ELSE
    IF NEW.playa_id_boleta IS NULL THEN
      RETURN NEW;
    END IF;
    v_boleta.playa_id := NEW.playa_id_boleta;
    v_boleta.plaza_id := NEW.plaza_id_boleta;
    v_boleta.fecha_hora_inicio_abono := NEW.fecha_hora_inicio_abono;
    v_boleta.fecha_generacion_boleta := NEW.fecha_generacion_boleta;
  END IF;
  
  SELECT COALESCE(SUM(monto_pago), 0)
  INTO v_total_pagado
  FROM public.pago
  WHERE playa_id_boleta = v_boleta.playa_id
    AND plaza_id_boleta = v_boleta.plaza_id
    AND fecha_hora_inicio_abono = v_boleta.fecha_hora_inicio_abono
    AND fecha_generacion_boleta = v_boleta.fecha_generacion_boleta;
  
  UPDATE public.boleta
  SET monto_pagado = v_total_pagado,
      estado = calculate_boleta_estado(monto, v_total_pagado, fecha_vencimiento_boleta)
  WHERE playa_id = v_boleta.playa_id
    AND plaza_id = v_boleta.plaza_id
    AND fecha_hora_inicio_abono = v_boleta.fecha_hora_inicio_abono
    AND fecha_generacion_boleta = v_boleta.fecha_generacion_boleta;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE VIEW v_boletas AS
SELECT 
  b.playa_id,
  b.plaza_id,
  b.fecha_hora_inicio_abono,
  b.fecha_generacion_boleta,
  b.numero_de_boleta,
  b.fecha_vencimiento_boleta,
  b.monto,
  b.monto_pagado,
  (b.monto - b.monto_pagado) as deuda_pendiente,
  b.estado,
  calculate_boleta_estado(b.monto, b.monto_pagado, b.fecha_vencimiento_boleta) as estado_calculado,
  ab.abonado_id,
  a.nombre || ' ' || a.apellido as abonado_nombre,
  a.dni as abonado_dni,
  pl.identificador as plaza_identificador,
  py.nombre as playa_nombre
FROM public.boleta b
JOIN public.abono ab ON 
  b.playa_id = ab.playa_id 
  AND b.plaza_id = ab.plaza_id 
  AND b.fecha_hora_inicio_abono = ab.fecha_hora_inicio
JOIN public.abonado a ON ab.abonado_id = a.abonado_id
JOIN public.plaza pl ON b.plaza_id = pl.plaza_id
JOIN public.playa py ON b.playa_id = py.playa_id;

COMMENT ON COLUMN public.boleta.monto_pagado IS 'Monto total pagado de la boleta (calculado automáticamente sumando pagos)';
COMMENT ON COLUMN public.boleta.estado IS 'Estado de la boleta: PENDIENTE, PAGADA, VENCIDA (calculado automáticamente)';
COMMENT ON VIEW v_boletas IS 'Vista enriquecida de boletas con información de abonado, plaza y estado calculado';

