DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'boleta'
      AND column_name = 'boleta_id'
  ) THEN
    ALTER TABLE public.boleta 
      ADD COLUMN boleta_id UUID DEFAULT gen_random_uuid() NOT NULL;

    ALTER TABLE public.boleta 
      DROP CONSTRAINT IF EXISTS boleta_pkey;

    ALTER TABLE public.boleta 
      ADD CONSTRAINT boleta_pkey PRIMARY KEY (boleta_id);

    ALTER TABLE public.boleta 
      ADD CONSTRAINT boleta_unique_composite 
      UNIQUE (playa_id, plaza_id, fecha_hora_inicio_abono, fecha_generacion_boleta);
    
    COMMENT ON COLUMN public.boleta.boleta_id IS 'Identificador único de la boleta';
  END IF;
END $$;

