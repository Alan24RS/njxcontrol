-- Configurar cron jobs para gestión automática de boletas de abonos
-- Requiere extensión pg_cron habilitada en Supabase

-- Habilitar pg_cron si no está habilitado
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Job 1: Actualizar estado de boletas vencidas (Diario a las 00:01)
-- Cambia PENDIENTE → VENCIDA cuando pasa la fecha de vencimiento
SELECT cron.schedule(
  'actualizar-boletas-vencidas',
  '1 0 * * *', -- 00:01 todos los días
  $$
    SELECT actualizar_boletas_vencidas();
  $$
);

-- Job 2: Generar boletas mensuales (Día 1 de cada mes a las 00:05)
-- Genera boletas para todos los abonos activos
SELECT cron.schedule(
  'generar-boletas-mensuales',
  '5 0 1 * *', -- 00:05 del día 1 de cada mes
  $$
    SELECT generar_boletas_mensuales();
  $$
);

-- Job 3: Notificar boletas próximas a vencer (Diario a las 09:00) - Opcional
-- Envía notificaciones 3 días antes del vencimiento
SELECT cron.schedule(
  'notificar-boletas-por-vencer',
  '0 9 * * *', -- 09:00 todos los días
  $$
    SELECT notificar_boletas_proximas_vencer();
  $$
);

COMMENT ON EXTENSION pg_cron IS 
  'Ejecuta trabajos programados en PostgreSQL para gestión automática de boletas y notificaciones.';

-- Ver trabajos programados
-- SELECT * FROM cron.job;

-- Para eliminar un job (si necesitas modificarlo):
-- SELECT cron.unschedule('nombre-del-job');
