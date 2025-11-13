DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'abono' 
    AND column_name = 'turno_creacion_playa_id'
  ) THEN
    ALTER TABLE public.abono 
    ADD COLUMN turno_creacion_playa_id UUID NOT NULL DEFAULT gen_random_uuid();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'abono' 
    AND column_name = 'turno_creacion_playero_id'
  ) THEN
    ALTER TABLE public.abono 
    ADD COLUMN turno_creacion_playero_id UUID NOT NULL DEFAULT gen_random_uuid();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'abono' 
    AND column_name = 'turno_creacion_fecha_hora_ingreso'
  ) THEN
    ALTER TABLE public.abono 
    ADD COLUMN turno_creacion_fecha_hora_ingreso TIMESTAMPTZ NOT NULL DEFAULT NOW();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'abono' 
    AND column_name = 'turno_finalizacion_playa_id'
  ) THEN
    ALTER TABLE public.abono 
    ADD COLUMN turno_finalizacion_playa_id UUID;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'abono' 
    AND column_name = 'turno_finalizacion_playero_id'
  ) THEN
    ALTER TABLE public.abono 
    ADD COLUMN turno_finalizacion_playero_id UUID;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'abono' 
    AND column_name = 'turno_finalizacion_fecha_hora_ingreso'
  ) THEN
    ALTER TABLE public.abono 
    ADD COLUMN turno_finalizacion_fecha_hora_ingreso TIMESTAMPTZ;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'abono_turno_creacion_fk'
  ) THEN
    ALTER TABLE public.abono
    ADD CONSTRAINT abono_turno_creacion_fk
    FOREIGN KEY (turno_creacion_playa_id, turno_creacion_playero_id, turno_creacion_fecha_hora_ingreso)
    REFERENCES public.turno(playa_id, playero_id, fecha_hora_ingreso)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'abono_turno_finalizacion_fk'
  ) THEN
    ALTER TABLE public.abono
    ADD CONSTRAINT abono_turno_finalizacion_fk
    FOREIGN KEY (turno_finalizacion_playa_id, turno_finalizacion_playero_id, turno_finalizacion_fecha_hora_ingreso)
    REFERENCES public.turno(playa_id, playero_id, fecha_hora_ingreso)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_abono_turno_creacion 
  ON public.abono(turno_creacion_playa_id, turno_creacion_playero_id, turno_creacion_fecha_hora_ingreso);

CREATE INDEX IF NOT EXISTS idx_abono_turno_finalizacion 
  ON public.abono(turno_finalizacion_playa_id, turno_finalizacion_playero_id, turno_finalizacion_fecha_hora_ingreso)
  WHERE turno_finalizacion_playa_id IS NOT NULL;

COMMENT ON COLUMN public.abono.turno_creacion_playa_id IS 'ID de la playa del turno en el que se creó el abono';
COMMENT ON COLUMN public.abono.turno_creacion_playero_id IS 'ID del playero del turno en el que se creó el abono';
COMMENT ON COLUMN public.abono.turno_creacion_fecha_hora_ingreso IS 'Fecha y hora de ingreso del turno en el que se creó el abono';
COMMENT ON COLUMN public.abono.turno_finalizacion_playa_id IS 'ID de la playa del turno en el que se finalizó el abono (NULL si aún está activo)';
COMMENT ON COLUMN public.abono.turno_finalizacion_playero_id IS 'ID del playero del turno en el que se finalizó el abono (NULL si aún está activo)';
COMMENT ON COLUMN public.abono.turno_finalizacion_fecha_hora_ingreso IS 'Fecha y hora de ingreso del turno en el que se finalizó el abono (NULL si aún está activo)';

