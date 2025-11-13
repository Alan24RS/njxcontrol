CREATE TABLE public.abonado (
  abonado_id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE,
  telefono VARCHAR(30),
  dni VARCHAR(20) UNIQUE NOT NULL,
  fecha_alta TIMESTAMP DEFAULT NOW(),
  estado BOOLEAN DEFAULT TRUE
);

-- Habilitar RLS
ALTER TABLE public.abonado ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para abonados
CREATE POLICY "Los playeros pueden ver abonados" 
  ON public.abonado
  FOR SELECT 
  TO authenticated 
  USING (
    -- Solo pueden ver abonados de las playas a las que tienen acceso
    EXISTS (
      SELECT 1 FROM public.playero_playa pp
      WHERE pp.playero_id = auth.uid()
    )
  );

CREATE POLICY "Los playeros pueden insertar abonados" 
  ON public.abonado 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (
    -- Solo pueden insertar abonados si tienen acceso a alguna playa
    EXISTS (
      SELECT 1 FROM public.playero_playa pp
      WHERE pp.playero_id = auth.uid()
    )
  );

CREATE POLICY "Los playeros pueden actualizar abonados" 
  ON public.abonado 
  FOR UPDATE 
  TO authenticated 
  USING (
    -- Solo pueden actualizar abonados de las playas a las que tienen acceso
    EXISTS (
      SELECT 1 FROM public.playero_playa pp
      WHERE pp.playero_id = auth.uid()
    )
  ) 
  WITH CHECK (
    -- Solo pueden actualizar abonados de las playas a las que tienen acceso
    EXISTS (
      SELECT 1 FROM public.playero_playa pp
      WHERE pp.playero_id = auth.uid()
    )
  );

-- Índices
CREATE INDEX idx_abonado_dni ON public.abonado(dni);
CREATE INDEX idx_abonado_email ON public.abonado(email) WHERE email IS NOT NULL;