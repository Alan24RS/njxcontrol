-- ===================================================================================
-- MIGRACIÓN: Añadir política RLS UPDATE para tabla pago
-- Descripción:
--   - Añade política que permite a playeros y dueños actualizar el método de pago
--   - Solo permite actualizaciones dentro de las 48 horas posteriores a la finalización
--   - El playero debe ser el creador de la ocupación o el dueño de la playa
-- ===================================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- Política RLS para UPDATE en tabla pago
-- -----------------------------------------------------------------------------

-- Playeros pueden actualizar el método de pago de ocupaciones que finalizaron hace menos de 48 horas
-- Solo pueden actualizar sus propios pagos o si son dueños de la playa
DROP POLICY IF EXISTS "playeros_actualizan_metodo_pago_48h" ON public.pago;
CREATE POLICY "playeros_actualizan_metodo_pago_48h"
  ON public.pago
  FOR UPDATE
  TO authenticated
  USING (
    -- El pago debe estar asociado a una ocupación finalizada
    EXISTS (
      SELECT 1
      FROM public.ocupacion o
      WHERE o.ocupacion_id = pago.ocupacion_id
        AND o.estado = 'FINALIZADO'
        -- La ocupación debe haber finalizado hace menos de 48 horas
        AND o.hora_egreso > (timezone('UTC', now()) - interval '48 hours')
        -- El usuario debe ser el playero creador o el dueño de la playa
        AND (
          o.playero_id = auth.uid()
          OR EXISTS (
            SELECT 1
            FROM public.playa p
            WHERE p.playa_id = o.playa_id
              AND p.playa_dueno_id = auth.uid()
          )
        )
    )
  )
  WITH CHECK (
    -- Validar que el pago sigue asociado a una ocupación finalizada
    -- y que la ventana de edición sigue siendo válida
    EXISTS (
      SELECT 1
      FROM public.ocupacion o
      WHERE o.ocupacion_id = pago.ocupacion_id
        AND o.estado = 'FINALIZADO'
        AND o.hora_egreso > (timezone('UTC', now()) - interval '48 hours')
        AND (
          o.playero_id = auth.uid()
          OR EXISTS (
            SELECT 1
            FROM public.playa p
            WHERE p.playa_id = o.playa_id
              AND p.playa_dueno_id = auth.uid()
          )
        )
    )
  );

COMMENT ON POLICY "playeros_actualizan_metodo_pago_48h" ON public.pago IS
  'Permite a playeros creadores y dueños de playa actualizar el método de pago de ocupaciones finalizadas dentro de las 48 horas posteriores';

COMMIT;

-- ===================================================================================
-- PLAN DE ROLLBACK
-- ===================================================================================
-- En caso de necesitar revertir esta migración:
--
-- BEGIN;
-- DROP POLICY IF EXISTS "playeros_actualizan_metodo_pago_48h" ON public.pago;
-- COMMIT;
--
-- ===================================================================================
