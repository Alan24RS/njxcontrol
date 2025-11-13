DO $$
BEGIN
  CREATE TABLE IF NOT EXISTS public.vehiculo (
    patente VARCHAR(7) PRIMARY KEY,
    tipo_vehiculo tipo_vehiculo NOT NULL,
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_patente_formato CHECK (
      patente ~ '^(?:[A-Z]{3}[0-9]{3}|[A-Z]{2}[0-9]{3}[A-Z]{2})$'
    )
  );
EXCEPTION
  WHEN duplicate_table THEN
    NULL;
END $$;

ALTER TABLE public.vehiculo ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  CREATE POLICY "playeros_pueden_ver_vehiculos" 
    ON public.vehiculo
    FOR SELECT 
    TO authenticated 
    USING (
      EXISTS (
        SELECT 1 FROM public.playero_playa pp
        WHERE pp.playero_id = auth.uid()
      )
    );
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "playeros_pueden_insertar_vehiculos" 
    ON public.vehiculo 
    FOR INSERT 
    TO authenticated 
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.playero_playa pp
        WHERE pp.playero_id = auth.uid()
      )
    );
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_vehiculo_tipo ON public.vehiculo(tipo_vehiculo);
CREATE INDEX IF NOT EXISTS idx_vehiculo_fecha_creacion ON public.vehiculo(fecha_creacion DESC);

COMMENT ON TABLE public.vehiculo IS 'Registro de vehículos del sistema. Usado para abonos y ocupaciones.';
COMMENT ON COLUMN public.vehiculo.patente IS 'Patente del vehículo (formato argentino)';
COMMENT ON COLUMN public.vehiculo.tipo_vehiculo IS 'Tipo de vehículo (AUTOMOVIL, MOTOCICLETA, CAMIONETA)';
COMMENT ON COLUMN public.vehiculo.fecha_creacion IS 'Fecha de registro del vehículo en el sistema';

