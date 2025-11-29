-- Índices para optimizar queries de recaudación mensual en analytics

-- Crear función IMMUTABLE para extraer mes de fecha
CREATE OR REPLACE FUNCTION public.extract_month_from_timestamp(ts TIMESTAMPTZ)
RETURNS DATE AS $$
BEGIN
  RETURN DATE_TRUNC('month', ts)::DATE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Índice para optimizar queries de recaudación mensual usando la función IMMUTABLE
CREATE INDEX IF NOT EXISTS idx_abono_fecha_mes 
  ON public.abono(extract_month_from_timestamp(fecha_hora_inicio))
  WHERE estado = 'ACTIVO';

-- Índice para filtros por playa y estado
CREATE INDEX IF NOT EXISTS idx_abono_playa_estado_fecha 
  ON public.abono(playa_id, estado, fecha_hora_inicio)
  WHERE estado = 'ACTIVO';

COMMENT ON FUNCTION public.extract_month_from_timestamp(TIMESTAMPTZ) IS 'Extrae el mes de un timestamp para indexación';
COMMENT ON INDEX idx_abono_fecha_mes IS 'Optimiza queries de recaudación mensual en reportes de analytics';
COMMENT ON INDEX idx_abono_playa_estado_fecha IS 'Optimiza filtros por playa y rango de fechas en reportes';
