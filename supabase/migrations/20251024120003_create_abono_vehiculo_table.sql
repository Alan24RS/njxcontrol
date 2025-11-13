CREATE TABLE public.abono_vehiculo (
  playa_id UUID NOT NULL,
  plaza_id UUID NOT NULL,
  fecha_hora_inicio TIMESTAMPTZ NOT NULL,
  patente VARCHAR(7) NOT NULL,
  PRIMARY KEY (playa_id, plaza_id, fecha_hora_inicio, patente),
  FOREIGN KEY (playa_id, plaza_id, fecha_hora_inicio) 
    REFERENCES public.abono(playa_id, plaza_id, fecha_hora_inicio)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  -- Constraint para validar formato de patente (igual que en ocupacion)
  CONSTRAINT chk_patente_formato CHECK (
    patente ~ '^(?:[A-Z]{3}[0-9]{3}|[A-Z]{2}[0-9]{3}[A-Z]{2})$'
  )
);

-- Habilitar RLS
ALTER TABLE public.abono_vehiculo ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para abono_vehiculo
CREATE POLICY "Los playeros pueden ver abono_vehiculo" 
  ON public.abono_vehiculo 
  FOR SELECT 
  TO authenticated 
  USING (
    -- Solo pueden ver vehículos de abonos en las playas a las que tienen acceso
    EXISTS (
      SELECT 1 FROM public.playero_playa pp
      WHERE pp.playero_id = auth.uid()
      AND pp.playa_id = abono_vehiculo.playa_id
    )
  );

CREATE POLICY "Los playeros pueden insertar abono_vehiculo" 
  ON public.abono_vehiculo 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (
    -- Solo pueden insertar vehículos en abonos de las playas a las que tienen acceso
    EXISTS (
      SELECT 1 FROM public.playero_playa pp
      WHERE pp.playero_id = auth.uid()
      AND pp.playa_id = abono_vehiculo.playa_id
    )
  );

CREATE POLICY "Los playeros pueden eliminar abono_vehiculo" 
  ON public.abono_vehiculo 
  FOR DELETE 
  TO authenticated 
  USING (
    -- Solo pueden eliminar vehículos de abonos en las playas a las que tienen acceso
    EXISTS (
      SELECT 1 FROM public.playero_playa pp
      WHERE pp.playero_id = auth.uid()
      AND pp.playa_id = abono_vehiculo.playa_id
    )
  );

-- Índices
CREATE INDEX idx_abono_vehiculo_patente ON public.abono_vehiculo(patente);
CREATE INDEX idx_abono_vehiculo_abono ON public.abono_vehiculo(playa_id, plaza_id, fecha_hora_inicio);