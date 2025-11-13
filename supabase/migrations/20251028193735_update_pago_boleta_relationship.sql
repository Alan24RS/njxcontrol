DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'pago_boleta_fk' 
    AND conrelid = 'public.pago'::regclass
  ) THEN
    ALTER TABLE public.pago DROP CONSTRAINT pago_boleta_fk;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'pago' 
    AND column_name = 'playa_id_boleta'
  ) THEN
    ALTER TABLE public.pago 
    ADD COLUMN playa_id_boleta UUID;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'pago' 
    AND column_name = 'plaza_id_boleta'
  ) THEN
    ALTER TABLE public.pago 
    ADD COLUMN plaza_id_boleta UUID;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'pago' 
    AND column_name = 'fecha_hora_inicio_abono'
  ) THEN
    ALTER TABLE public.pago 
    ADD COLUMN fecha_hora_inicio_abono TIMESTAMPTZ;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'pago' 
    AND column_name = 'fecha_generacion_boleta'
  ) THEN
    ALTER TABLE public.pago 
    ADD COLUMN fecha_generacion_boleta DATE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'pago_boleta_compuesta_fk'
  ) THEN
    ALTER TABLE public.pago
    ADD CONSTRAINT pago_boleta_compuesta_fk
    FOREIGN KEY (playa_id_boleta, plaza_id_boleta, fecha_hora_inicio_abono, fecha_generacion_boleta)
    REFERENCES public.boleta(playa_id, plaza_id, fecha_hora_inicio_abono, fecha_generacion_boleta)
    DEFERRABLE INITIALLY DEFERRED;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'pago_xor' 
    AND conrelid = 'public.pago'::regclass
  ) THEN
    ALTER TABLE public.pago DROP CONSTRAINT pago_xor;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'pago_xor_updated'
  ) THEN
    ALTER TABLE public.pago
    ADD CONSTRAINT pago_xor_updated CHECK (
      ((ocupacion_id IS NOT NULL)::int + 
       (playa_id_boleta IS NOT NULL AND plaza_id_boleta IS NOT NULL AND 
        fecha_hora_inicio_abono IS NOT NULL AND fecha_generacion_boleta IS NOT NULL)::int) = 1
    );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_pago_boleta_compuesta 
  ON public.pago(playa_id_boleta, plaza_id_boleta, fecha_hora_inicio_abono, fecha_generacion_boleta)
  WHERE playa_id_boleta IS NOT NULL;

COMMENT ON COLUMN public.pago.playa_id_boleta IS 'ID de playa de la boleta relacionada (parte de PK compuesta)';
COMMENT ON COLUMN public.pago.plaza_id_boleta IS 'ID de plaza de la boleta relacionada (parte de PK compuesta)';
COMMENT ON COLUMN public.pago.fecha_hora_inicio_abono IS 'Fecha inicio del abono de la boleta (parte de PK compuesta)';
COMMENT ON COLUMN public.pago.fecha_generacion_boleta IS 'Fecha de generación de la boleta (parte de PK compuesta)';

