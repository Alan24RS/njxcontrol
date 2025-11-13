CREATE TABLE public.boleta (
  boleta_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playa_id UUID NOT NULL,
  plaza_id UUID NOT NULL,
  fecha_hora_inicio_abono TIMESTAMPTZ NOT NULL,
  fecha_generacion_boleta DATE NOT NULL,
  numero_de_boleta SERIAL UNIQUE NOT NULL,
  fecha_vencimiento_boleta DATE NOT NULL,
  fecha_pago DATE,
  numero_de_pago INT,
  monto DECIMAL(10, 2) NOT NULL,
  CONSTRAINT boleta_unique_composite UNIQUE (playa_id, plaza_id, fecha_hora_inicio_abono, fecha_generacion_boleta),
  FOREIGN KEY (playa_id, plaza_id, fecha_hora_inicio_abono) 
    REFERENCES public.abono(playa_id, plaza_id, fecha_hora_inicio)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  -- Validar que fecha_vencimiento sea posterior a fecha_generacion
  CONSTRAINT fecha_vencimiento_valida CHECK (fecha_vencimiento_boleta >= fecha_generacion_boleta),
  -- Validar que fecha_pago sea posterior o igual a fecha_generacion y anterior o igual a fecha_vencimiento
  CONSTRAINT fecha_pago_valida CHECK (
    fecha_pago IS NULL OR 
    (fecha_pago >= fecha_generacion_boleta AND fecha_pago <= fecha_vencimiento_boleta)
  ),
  -- Validar que el monto sea positivo
  CONSTRAINT monto_positivo CHECK (monto > 0)
);

-- Habilitar RLS
ALTER TABLE public.boleta ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para boletas
CREATE POLICY "Los playeros pueden ver boletas" 
  ON public.boleta 
  FOR SELECT 
  TO authenticated 
  USING (
    -- Solo pueden ver boletas de las playas a las que tienen acceso
    EXISTS (
      SELECT 1 FROM public.playero_playa pp
      WHERE pp.playero_id = auth.uid()
      AND pp.playa_id = boleta.playa_id
    )
  );

CREATE POLICY "Los playeros pueden insertar boletas" 
  ON public.boleta 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (
    -- Solo pueden insertar boletas en las playas a las que tienen acceso
    EXISTS (
      SELECT 1 FROM public.playero_playa pp
      WHERE pp.playero_id = auth.uid()
      AND pp.playa_id = boleta.playa_id
    )
  );

CREATE POLICY "Los playeros pueden actualizar boletas" 
  ON public.boleta 
  FOR UPDATE 
  TO authenticated 
  USING (
    -- Solo pueden actualizar boletas de las playas a las que tienen acceso
    EXISTS (
      SELECT 1 FROM public.playero_playa pp
      WHERE pp.playero_id = auth.uid()
      AND pp.playa_id = boleta.playa_id
    )
  ) 
  WITH CHECK (
    -- Solo pueden actualizar boletas en las playas a las que tienen acceso
    EXISTS (
      SELECT 1 FROM public.playero_playa pp
      WHERE pp.playero_id = auth.uid()
      AND pp.playa_id = boleta.playa_id
    )
  );

-- Índices
CREATE INDEX idx_boleta_numero ON public.boleta(numero_de_boleta);
CREATE INDEX idx_boleta_abono ON public.boleta(playa_id, plaza_id, fecha_hora_inicio_abono);
CREATE INDEX idx_boleta_fechas ON public.boleta(fecha_generacion_boleta, fecha_vencimiento_boleta);
CREATE INDEX idx_boleta_pago ON public.boleta(fecha_pago) WHERE fecha_pago IS NOT NULL;

-- Comentarios
COMMENT ON TABLE public.boleta IS 'Registro de boletas de pago para abonos';
COMMENT ON COLUMN public.boleta.boleta_id IS 'Identificador único de la boleta';
COMMENT ON COLUMN public.boleta.playa_id IS 'ID de la playa';
COMMENT ON COLUMN public.boleta.plaza_id IS 'ID de la plaza';
COMMENT ON COLUMN public.boleta.fecha_hora_inicio_abono IS 'Fecha y hora de inicio del abono al que pertenece la boleta';
COMMENT ON COLUMN public.boleta.fecha_generacion_boleta IS 'Fecha de generación de la boleta';
COMMENT ON COLUMN public.boleta.numero_de_boleta IS 'Número único de boleta (generado automáticamente)';
COMMENT ON COLUMN public.boleta.fecha_vencimiento_boleta IS 'Fecha de vencimiento de la boleta';
COMMENT ON COLUMN public.boleta.fecha_pago IS 'Fecha en que se pagó la boleta (NULL si no está pagada)';
COMMENT ON COLUMN public.boleta.numero_de_pago IS 'Número de pago o comprobante';
COMMENT ON COLUMN public.boleta.monto IS 'Monto de la boleta';