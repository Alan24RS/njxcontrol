DROP VIEW IF EXISTS public.v_abonos_vigentes CASCADE;

CREATE OR REPLACE VIEW public.v_abonos_vigentes AS
SELECT 
  a.playa_id,
  a.plaza_id,
  a.fecha_hora_inicio,
  a.fecha_fin,
  a.precio_mensual,
  a.estado,
  a.abonado_id,
  p.nombre AS playa_nombre,
  pl.identificador AS plaza_identificador,
  tp.nombre AS tipo_plaza_nombre,
  ab.nombre AS abonado_nombre,
  ab.apellido AS cliente_apellido,
  ab.dni AS abonado_dni,
  (
    a.fecha_hora_inicio::DATE + 
    ((EXTRACT(YEAR FROM age(CURRENT_DATE, a.fecha_hora_inicio::DATE)) * 12 + 
      EXTRACT(MONTH FROM age(CURRENT_DATE, a.fecha_hora_inicio::DATE)) + 
      CASE 
        WHEN EXTRACT(DAY FROM CURRENT_DATE) >= EXTRACT(DAY FROM a.fecha_hora_inicio::DATE) 
        THEN 1 
        ELSE 0 
      END
    )::INTEGER || ' months')::INTERVAL
  )::DATE AS fecha_vencimiento
FROM public.abono a
INNER JOIN public.playa p ON a.playa_id = p.playa_id
INNER JOIN public.plaza pl ON a.plaza_id = pl.plaza_id
INNER JOIN public.tipo_plaza tp ON pl.tipo_plaza_id = tp.tipo_plaza_id
INNER JOIN public.abonado ab ON a.abonado_id = ab.abonado_id
WHERE a.estado = 'ACTIVO'
  AND a.fecha_fin IS NULL;

ALTER VIEW public.v_abonos_vigentes SET (security_invoker = true);

GRANT SELECT ON TABLE public.v_abonos_vigentes TO authenticated;
GRANT SELECT ON TABLE public.v_abonos_vigentes TO anon;
GRANT SELECT ON TABLE public.v_abonos_vigentes TO service_role;

COMMENT ON VIEW public.v_abonos_vigentes IS 'Vista de abonos vigentes con información de playa, plaza, abonado y fecha de vencimiento calculada del próximo ciclo mensual (mesiversario) basado en la fecha de inicio del abono.';

