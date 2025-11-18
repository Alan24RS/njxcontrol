-- Vista para obtener el reporte de abonos vigentes por playa
-- Muestra la cantidad de abonos activos para cada playa
CREATE OR REPLACE VIEW public.abonos_vigentes_por_playa AS
SELECT 
  p.playa_id,
  p.nombre AS playa_nombre,
  p.direccion,
  p.latitud,
  p.longitud,
  COUNT(DISTINCT a.abonado_id) AS total_abonos_vigentes,
  COUNT(DISTINCT a.plaza_id) AS plazas_ocupadas_por_abono,
  COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'abonado_id', a.abonado_id,
        'nombre_completo', CONCAT(ab.nombre, ' ', ab.apellido),
        'dni', ab.dni,
        'plaza_id', a.plaza_id,
        'fecha_inicio', a.fecha_hora_inicio,
        'fecha_fin', a.fecha_fin,
        'plaza_identificador', pl.identificador
      ) ORDER BY a.fecha_hora_inicio DESC
    ) FILTER (WHERE a.abonado_id IS NOT NULL),
    '[]'::jsonb
  ) AS detalle_abonos
FROM public.playa p
LEFT JOIN public.abono a 
  ON p.playa_id = a.playa_id 
  AND (a.fecha_fin IS NULL OR CURRENT_DATE <= a.fecha_fin)  -- Solo abonos vigentes (NULL = vigente indefinido)
LEFT JOIN public.abonado ab 
  ON a.abonado_id = ab.abonado_id
LEFT JOIN public.plaza pl 
  ON a.plaza_id = pl.plaza_id
GROUP BY p.playa_id, p.nombre, p.direccion, p.latitud, p.longitud
ORDER BY p.nombre;

-- Habilitar RLS en la vista
ALTER VIEW public.abonos_vigentes_por_playa SET (security_invoker = true);

-- Comentarios
COMMENT ON VIEW public.abonos_vigentes_por_playa IS 'Vista que muestra estadísticas de abonos vigentes agrupados por playa. Solo accesible para dueños de playas.';

-- Política RLS para la vista (los dueños solo ven sus playas)
-- Nota: Las vistas heredan las políticas RLS de las tablas subyacentes cuando se usa security_invoker
