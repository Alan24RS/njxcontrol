-- Migration: Agregar constraint de patente única para ocupaciones activas
-- Date: 2025-10-18
-- Description: 
--   Agregar constraint único para evitar patentes duplicadas en ocupaciones activas
--
-- NOTA HISTÓRICA sobre MENSUAL:
--   Esta migración originalmente documentaba la remoción parcial de MENSUAL.
--   En la migración 20251028130932_remove_mensual_from_modalidad_ocupacion.sql
--   se completó la eliminación total de MENSUAL del enum modalidad_ocupacion.
--   Las modalidades válidas ahora son: POR_HORA, DIARIA, SEMANAL

-- ============================================================================
-- Agregar constraint de patente única en ocupaciones activas (POR PLAYA)
-- ============================================================================

-- Crear índice único parcial: una patente no puede estar en dos ocupaciones activas simultáneamente
-- en la MISMA playa. Una ocupación está activa si hora_egreso IS NULL.
-- 
-- DECISIÓN DE DISEÑO: Scope por playa (playa_id, patente)
-- ¿Por qué no constraint global (solo patente)?
--   - Performance: Consultar patentes activas en TODAS las playas del sistema sería demasiado costoso
--   - Escalabilidad: Con miles de playas en producción, queries multi-playa generarían overhead significativo
--   - Caso de uso: Es poco probable (pero posible) que la misma patente esté en dos playas distintas
--   - Trade-off: Priorizamos performance sobre prevención total de este edge case
-- 
-- Si en el futuro se detecta abuso (misma patente en múltiples playas), considerar:
--   1. Background job para detectar duplicados entre playas
--   2. Alert system para casos sospechosos
--   3. Migración a constraint global con optimización de índices
CREATE UNIQUE INDEX IF NOT EXISTS idx_ocupacion_patente_activa 
  ON ocupacion(playa_id, patente) 
  WHERE hora_egreso IS NULL;

-- ============================================================================
-- Comentarios
-- ============================================================================

COMMENT ON INDEX idx_ocupacion_patente_activa IS 
  'Garantiza que una patente solo pueda estar en una ocupación activa por playa a la vez';
