DO $$
BEGIN
  CREATE TYPE abono_estado AS ENUM ('ACTIVO', 'FINALIZADO', 'SUSPENDIDO');
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'abono' 
    AND column_name = 'fecha_fin'
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.abono 
    ALTER COLUMN fecha_fin DROP NOT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'abono' 
    AND column_name = 'precio_mensual'
  ) THEN
    ALTER TABLE public.abono 
    ADD COLUMN precio_mensual DECIMAL(10, 2);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'abono' 
    AND column_name = 'estado'
  ) THEN
    ALTER TABLE public.abono 
    ADD COLUMN estado abono_estado NOT NULL DEFAULT 'ACTIVO'::abono_estado;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.get_day_of_month(ts TIMESTAMPTZ)
RETURNS INTEGER AS $$
BEGIN
  RETURN EXTRACT(DAY FROM ts)::INTEGER;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE INDEX IF NOT EXISTS idx_abono_estado_activo 
  ON public.abono(playa_id, estado) 
  WHERE estado = 'ACTIVO';

CREATE INDEX IF NOT EXISTS idx_abono_dia_cobro 
  ON public.abono(get_day_of_month(fecha_hora_inicio)) 
  WHERE estado = 'ACTIVO' AND fecha_fin IS NULL;

COMMENT ON COLUMN public.abono.fecha_fin IS 'Fecha de finalización del abono (NULL = abono continuo sin fecha de fin)';
COMMENT ON COLUMN public.abono.precio_mensual IS 'Precio mensual congelado al crear el abono (tarifa más alta de los vehículos registrados)';
COMMENT ON COLUMN public.abono.estado IS 'Estado del abono: ACTIVO, FINALIZADO, SUSPENDIDO';

