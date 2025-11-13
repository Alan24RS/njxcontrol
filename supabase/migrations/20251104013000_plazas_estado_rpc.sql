
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estado_operativo_plaza') THEN
        CREATE TYPE estado_operativo_plaza AS ENUM ('Disponible', 'Ocupada', 'Fuera de servicio');
    END IF;
END$$;


CREATE OR REPLACE FUNCTION get_plazas_con_estado(p_playa_id uuid)
RETURNS TABLE (
  plaza_id uuid,
  identificador TEXT,
  tipo_plaza_nombre TEXT,
  estado_operativo estado_operativo_plaza
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.plaza_id,
    p.identificador,
    tp.nombre AS tipo_plaza_nombre,
    CASE
      
      WHEN p.estado = 'SUSPENDIDO'::plaza_estado THEN 'Fuera de servicio'::estado_operativo_plaza
      WHEN o.ocupacion_id IS NOT NULL THEN 'Ocupada'::estado_operativo_plaza
      ELSE 'Disponible'::estado_operativo_plaza
    END AS estado_operativo
  FROM
    plaza p
    JOIN tipo_plaza tp ON p.tipo_plaza_id = tp.tipo_plaza_id
    LEFT JOIN ocupacion o ON p.plaza_id = o.plaza_id 
      
      AND o.estado = 'ACTIVA'::public.estado_ocupacion
  WHERE
    p.playa_id = p_playa_id
    AND p.fecha_eliminacion IS NULL
  ORDER BY
    p.identificador;
END;
$$;