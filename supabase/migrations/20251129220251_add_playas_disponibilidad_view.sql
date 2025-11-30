-- Vista para calcular disponibilidad de plazas por tipo para cada playa
-- Esta vista muestra plazas totales y disponibles agrupadas por playa y tipo de plaza
-- Una plaza está disponible si: estado ACTIVO + sin ocupación activa + sin abono vigente

-- Primero, crear una vista para identificar plazas no disponibles (ocupadas o con abono)
DROP VIEW IF EXISTS v_plazas_no_disponibles;

CREATE VIEW v_plazas_no_disponibles AS
SELECT DISTINCT p.plaza_id
FROM plaza p
WHERE 
  -- Plazas con ocupación activa (sin fecha de fin o fecha de fin futura)
  EXISTS (
    SELECT 1 
    FROM ocupacion o
    WHERE o.plaza_id = p.plaza_id
      AND o.playa_id = p.playa_id
      AND o.estado = 'ACTIVO'
      AND (o.hora_egreso IS NULL OR o.hora_egreso > now())
  )
  OR
  -- Plazas con abono vigente (fecha fin NULL o futura)
  EXISTS (
    SELECT 1
    FROM abono a
    WHERE a.plaza_id = p.plaza_id
      AND a.playa_id = p.playa_id
      AND (a.fecha_fin IS NULL OR a.fecha_fin >= CURRENT_DATE)
  );

-- Comentario para la vista de plazas no disponibles
COMMENT ON VIEW v_plazas_no_disponibles IS 'Vista que identifica plazas no disponibles por tener ocupación activa o abono vigente';

-- Ahora crear la vista principal de disponibilidad por playa y tipo
DROP VIEW IF EXISTS v_playas_disponibilidad;

CREATE VIEW v_playas_disponibilidad AS
SELECT 
  pl.playa_id,
  pl.nombre AS playa_nombre,
  pl.direccion AS playa_direccion,
  pl.descripcion AS playa_descripcion,
  pl.horario AS playa_horario,
  pl.latitud AS playa_latitud,
  pl.longitud AS playa_longitud,
  pl.estado AS playa_estado,
  pl.ciudad_id,
  c.nombre AS ciudad_nombre,
  c.provincia AS ciudad_provincia,
  tp.tipo_plaza_id,
  tp.nombre AS tipo_plaza_nombre,
  tp.descripcion AS tipo_plaza_descripcion,
  COUNT(p.plaza_id) AS total_plazas,
  COUNT(p.plaza_id) FILTER (
    WHERE p.estado = 'ACTIVO' 
      AND p.plaza_id NOT IN (SELECT plaza_id FROM v_plazas_no_disponibles)
  ) AS plazas_disponibles
FROM playa pl
INNER JOIN ciudad c ON pl.ciudad_id = c.ciudad_id
INNER JOIN tipo_plaza tp ON tp.playa_id = pl.playa_id
LEFT JOIN plaza p ON p.playa_id = pl.playa_id 
  AND p.tipo_plaza_id = tp.tipo_plaza_id
  AND p.fecha_eliminacion IS NULL
WHERE pl.fecha_eliminacion IS NULL
  AND pl.estado = 'ACTIVO'
GROUP BY 
  pl.playa_id,
  pl.nombre,
  pl.direccion,
  pl.descripcion,
  pl.horario,
  pl.latitud,
  pl.longitud,
  pl.estado,
  pl.ciudad_id,
  c.nombre,
  c.provincia,
  tp.tipo_plaza_id,
  tp.nombre,
  tp.descripcion
ORDER BY pl.nombre, tp.nombre;

-- Configurar security_invoker para respetar RLS
ALTER VIEW v_playas_disponibilidad SET (security_invoker = true);

-- Comentario para la vista principal
COMMENT ON VIEW v_playas_disponibilidad IS 'Vista que muestra disponibilidad de plazas por tipo para cada playa. Calcula total de plazas y plazas disponibles (ACTIVAS sin ocupación ni abono). Usa security_invoker=true para respetar las políticas RLS de las tablas base.';

-- Permisos para usuarios autenticados y anónimos (información pública)
GRANT SELECT ON TABLE v_playas_disponibilidad TO anon;
GRANT SELECT ON TABLE v_playas_disponibilidad TO authenticated;
GRANT ALL ON TABLE v_playas_disponibilidad TO service_role;

-- Habilitar acceso público a las tablas base necesarias para la vista
-- (La disponibilidad de plazas es información pública)

-- Permitir SELECT público en la tabla playa (solo playas activas)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'playa' AND policyname = 'playa_select_public'
  ) THEN
    CREATE POLICY playa_select_public ON playa
      FOR SELECT
      TO anon, authenticated
      USING (estado = 'ACTIVO' AND fecha_eliminacion IS NULL);
  END IF;
END $$;

-- Permitir SELECT público en la tabla tipo_plaza
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'tipo_plaza' AND policyname = 'tipo_plaza_select_public'
  ) THEN
    CREATE POLICY tipo_plaza_select_public ON tipo_plaza
      FOR SELECT
      TO anon, authenticated
      USING (fecha_eliminacion IS NULL);
  END IF;
END $$;

-- Permitir SELECT público en la tabla plaza
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'plaza' AND policyname = 'plaza_select_public'
  ) THEN
    CREATE POLICY plaza_select_public ON plaza
      FOR SELECT
      TO anon, authenticated
      USING (fecha_eliminacion IS NULL);
  END IF;
END $$;

-- Permitir SELECT público en la tabla ciudad
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'ciudad' AND policyname = 'ciudad_select_public'
  ) THEN
    CREATE POLICY ciudad_select_public ON ciudad
      FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;
END $$;

-- Permitir SELECT público en la tabla ocupacion (necesaria para calcular disponibilidad)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'ocupacion' AND policyname = 'ocupacion_select_public'
  ) THEN
    CREATE POLICY ocupacion_select_public ON ocupacion
      FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;
END $$;

-- Permitir SELECT público en la tabla abono (necesaria para calcular disponibilidad)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'abono' AND policyname = 'abono_select_public'
  ) THEN
    CREATE POLICY abono_select_public ON abono
      FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;
END $$;

-- Crear índices en las tablas base para optimizar las consultas
-- (si no existen ya)

DO $$ 
BEGIN
  -- Índice para búsquedas de ocupaciones activas por plaza
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_ocupacion_plaza_activa'
  ) THEN
    CREATE INDEX idx_ocupacion_plaza_activa 
    ON ocupacion(plaza_id, playa_id, estado) 
    WHERE estado = 'ACTIVO';
  END IF;

  -- Índice para búsquedas de abonos vigentes por plaza
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_abono_plaza_vigente'
  ) THEN
    CREATE INDEX idx_abono_plaza_vigente 
    ON abono(plaza_id, playa_id, fecha_fin);
  END IF;

  -- Índice para plazas activas por tipo y playa
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_plaza_tipo_estado'
  ) THEN
    CREATE INDEX idx_plaza_tipo_estado 
    ON plaza(playa_id, tipo_plaza_id, estado) 
    WHERE fecha_eliminacion IS NULL;
  END IF;
END $$;
