DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'abono_vehiculo_vehiculo_fk'
  ) THEN
    ALTER TABLE public.abono_vehiculo
    ADD CONSTRAINT abono_vehiculo_vehiculo_fk
    FOREIGN KEY (patente)
    REFERENCES public.vehiculo(patente)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;
  END IF;
END $$;

COMMENT ON CONSTRAINT abono_vehiculo_vehiculo_fk ON public.abono_vehiculo IS 
  'Vincula abono_vehiculo con vehiculo. RESTRICT previene eliminar vehículos con abonos activos.';

