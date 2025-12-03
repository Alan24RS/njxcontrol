-- Función para notificar a usuarios sobre boletas próximas a vencer
-- Se ejecuta diariamente y alerta 3 días antes del vencimiento

CREATE OR REPLACE FUNCTION public.notificar_boletas_proximas_vencer()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_boleta RECORD;
  v_notificaciones_enviadas INTEGER := 0;
  v_dias_alerta INTEGER := 3; -- Alertar 3 días antes
BEGIN
  -- Buscar boletas PENDIENTES que vencen en 3 días
  FOR v_boleta IN 
    SELECT 
      b.playa_id,
      b.plaza_id,
      b.fecha_hora_inicio_abono,
      b.fecha_generacion_boleta,
      b.numero_de_boleta,
      b.fecha_vencimiento_boleta,
      b.monto,
      b.monto_pagado,
      (b.monto - b.monto_pagado) as deuda_pendiente,
      ab.abonado_id,
      a.nombre,
      a.apellido,
      a.email,
      a.telefono,
      pl.identificador as plaza_identificador,
      p.nombre as playa_nombre
    FROM public.boleta b
    JOIN public.abono ab ON 
      b.playa_id = ab.playa_id 
      AND b.plaza_id = ab.plaza_id 
      AND b.fecha_hora_inicio_abono = ab.fecha_hora_inicio
    JOIN public.abonado a ON ab.abonado_id = a.abonado_id
    JOIN public.plaza pl ON b.plaza_id = pl.plaza_id
    JOIN public.playa p ON b.playa_id = p.playa_id
    WHERE b.estado = 'PENDIENTE'::boleta_estado
      AND b.fecha_vencimiento_boleta = CURRENT_DATE + v_dias_alerta
      AND (b.monto - b.monto_pagado) > 0
  LOOP
    -- Aquí integrarías con tu sistema de notificaciones
    -- Por ahora, registramos en una tabla de log o enviamos a un webhook
    
    -- Ejemplo: Insertar en tabla de notificaciones pendientes
    -- INSERT INTO notificaciones_pendientes (...)
    
    v_notificaciones_enviadas := v_notificaciones_enviadas + 1;
    
    -- Log para debugging
    RAISE NOTICE 'Notificación: Boleta % de % % vence en % días. Deuda: $%',
      v_boleta.numero_de_boleta,
      v_boleta.nombre,
      v_boleta.apellido,
      v_dias_alerta,
      v_boleta.deuda_pendiente;
  END LOOP;

  RETURN jsonb_build_object(
    'fecha_ejecucion', CURRENT_DATE,
    'dias_alerta', v_dias_alerta,
    'notificaciones_enviadas', v_notificaciones_enviadas
  );
END;
$$;

COMMENT ON FUNCTION public.notificar_boletas_proximas_vencer IS 
  'Notifica a usuarios sobre boletas PENDIENTES que vencen en 3 días. Se ejecuta diariamente a las 09:00.';

-- Tabla opcional para registrar notificaciones enviadas (para auditoría)
CREATE TABLE IF NOT EXISTS public.notificacion_boleta_log (
  id BIGSERIAL PRIMARY KEY,
  boleta_playa_id UUID NOT NULL,
  boleta_plaza_id UUID NOT NULL,
  boleta_fecha_hora_inicio_abono TIMESTAMPTZ NOT NULL,
  boleta_fecha_generacion DATE NOT NULL,
  abonado_id INTEGER NOT NULL,
  tipo_notificacion VARCHAR(50) NOT NULL, -- 'PROXIMO_VENCER', 'VENCIDA', 'PAGADA'
  fecha_envio TIMESTAMPTZ DEFAULT NOW(),
  canal VARCHAR(20), -- 'EMAIL', 'SMS', 'PUSH'
  estado VARCHAR(20) DEFAULT 'ENVIADO', -- 'ENVIADO', 'FALLIDO', 'PENDIENTE'
  FOREIGN KEY (boleta_playa_id, boleta_plaza_id, boleta_fecha_hora_inicio_abono, boleta_fecha_generacion)
    REFERENCES public.boleta(playa_id, plaza_id, fecha_hora_inicio_abono, fecha_generacion_boleta)
    ON DELETE CASCADE,
  FOREIGN KEY (abonado_id)
    REFERENCES public.abonado(abonado_id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notificacion_boleta_log_fecha ON public.notificacion_boleta_log(fecha_envio);
CREATE INDEX IF NOT EXISTS idx_notificacion_boleta_log_abonado ON public.notificacion_boleta_log(abonado_id);

COMMENT ON TABLE public.notificacion_boleta_log IS 
  'Registro de notificaciones enviadas a abonados sobre el estado de sus boletas.';
