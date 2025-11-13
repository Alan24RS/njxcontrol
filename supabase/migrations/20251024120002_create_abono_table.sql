CREATE TABLE public.abono (
  playa_id UUID NOT NULL,
  plaza_id UUID NOT NULL,
  fecha_hora_inicio TIMESTAMPTZ NOT NULL,
  fecha_fin DATE NOT NULL,
  abonado_id INTEGER NOT NULL REFERENCES public.abonado(abonado_id),
  PRIMARY KEY (playa_id, plaza_id, fecha_hora_inicio),
  -- Split into two foreign keys since plaza table uses single-column PK
  FOREIGN KEY (plaza_id) 
    REFERENCES public.plaza(plaza_id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  FOREIGN KEY (playa_id)
    REFERENCES public.playa(playa_id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  -- Agregar validación para que fecha_fin sea posterior a fecha_hora_inicio
  CONSTRAINT fecha_fin_valida CHECK (fecha_fin::timestamptz > fecha_hora_inicio)
);

-- Habilitar RLS
ALTER TABLE public.abono ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para abonos
CREATE POLICY "Los playeros pueden ver abonos" 
  ON public.abono 
  FOR SELECT 
  TO authenticated 
  USING (
    -- Solo pueden ver abonos de las playas a las que tienen acceso
    EXISTS (
      SELECT 1 FROM public.playero_playa pp
      WHERE pp.playero_id = auth.uid()
      AND pp.playa_id = abono.playa_id
    )
  );

CREATE POLICY "Los playeros pueden insertar abonos" 
  ON public.abono 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (
    -- Solo pueden insertar abonos en las playas a las que tienen acceso
    EXISTS (
      SELECT 1 FROM public.playero_playa pp
      WHERE pp.playero_id = auth.uid()
      AND pp.playa_id = abono.playa_id
    ) AND
    -- Validar que la plaza pertenezca a la playa
    EXISTS (
      SELECT 1 FROM public.plaza p
      WHERE p.plaza_id = abono.plaza_id
      AND p.playa_id = abono.playa_id
    )
  );

CREATE POLICY "Los playeros pueden actualizar abonos" 
  ON public.abono 
  FOR UPDATE 
  TO authenticated 
  USING (
    -- Solo pueden actualizar abonos de las playas a las que tienen acceso
    EXISTS (
      SELECT 1 FROM public.playero_playa pp
      WHERE pp.playero_id = auth.uid()
      AND pp.playa_id = abono.playa_id
    )
  ) 
  WITH CHECK (
    -- Solo pueden actualizar abonos en las playas a las que tienen acceso
    EXISTS (
      SELECT 1 FROM public.playero_playa pp
      WHERE pp.playero_id = auth.uid()
      AND pp.playa_id = abono.playa_id
    ) AND
    -- Validar que la plaza pertenezca a la playa
    EXISTS (
      SELECT 1 FROM public.plaza p
      WHERE p.plaza_id = abono.plaza_id
      AND p.playa_id = abono.playa_id
    )
  );

-- Trigger para validar plaza_id pertenece a playa_id antes de INSERT/UPDATE
CREATE OR REPLACE FUNCTION check_plaza_belongs_to_playa()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.plaza p
    WHERE p.plaza_id = NEW.plaza_id
    AND p.playa_id = NEW.playa_id
  ) THEN
    RAISE EXCEPTION 'La plaza % no pertenece a la playa %', NEW.plaza_id, NEW.playa_id
    USING HINT = 'Verifique que la plaza pertenezca a la playa correcta';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_plaza_belongs_to_playa
  BEFORE INSERT OR UPDATE ON public.abono
  FOR EACH ROW
  EXECUTE FUNCTION check_plaza_belongs_to_playa();

-- Índices
CREATE INDEX idx_abono_abonado ON public.abono(abonado_id);
CREATE INDEX idx_abono_playa_plaza ON public.abono(playa_id, plaza_id);
CREATE INDEX idx_abono_fecha_hora_inicio ON public.abono(fecha_hora_inicio);
CREATE INDEX idx_abono_fecha_fin ON public.abono(fecha_fin);

-- Comentarios
COMMENT ON TABLE public.abono IS 'Registra los abonos activos de las plazas';
COMMENT ON COLUMN public.abono.playa_id IS 'ID de la playa';
COMMENT ON COLUMN public.abono.plaza_id IS 'ID de la plaza';
COMMENT ON COLUMN public.abono.fecha_hora_inicio IS 'Fecha y hora de inicio del abono';
COMMENT ON COLUMN public.abono.fecha_fin IS 'Fecha de fin del abono';
COMMENT ON COLUMN public.abono.abonado_id IS 'ID del abonado';