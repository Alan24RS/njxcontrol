
CREATE OR REPLACE FUNCTION get_recaudacion_turno(
  p_playa_id uuid,
  p_turno_fecha_hora_ingreso timestamptz
)
RETURNS numeric
AS $$
DECLARE
  total_recaudacion numeric;
BEGIN
  SELECT COALESCE(SUM(monto_pago), 0)
  INTO total_recaudacion
  FROM public.pago 
  WHERE playa_id = p_playa_id
    AND turno_fecha_hora_ingreso = p_turno_fecha_hora_ingreso;

  RETURN total_recaudacion;
END;
$$ LANGUAGE plpgsql;
