-- ===================================================================================
-- MIGRACIÓN: Crear tabla pago y tabla de soporte para registrar cobros
-- Descripción:
--   - Modela la tabla public.pago con constraints, índices y RLS completos
--   - Agrega tabla auxiliar boleta_placeholder (hasta que exista la tabla real)
--   - Crea tabla public.pago_event_log para observabilidad
--   - Define políticas de seguridad y plan de rollback documentado
-- ===================================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- Tabla principal de pagos (resuelve FK boleta vs placeholder dinámicamente)
-- -----------------------------------------------------------------------------
DO $pago$
DECLARE
  target_boleta text;
  boleta_has_uuid_pk boolean;
BEGIN
  boleta_has_uuid_pk := EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'boleta'
      AND column_name = 'boleta_id'
  );

  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'boleta'
  ) AND boleta_has_uuid_pk THEN
    target_boleta := 'boleta';
  ELSE
    target_boleta := 'boleta_placeholder';
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = 'boleta_placeholder'
    ) THEN
      EXECUTE $create_placeholder$
        CREATE TABLE public.boleta_placeholder (
          boleta_id uuid PRIMARY KEY,
          created_at timestamptz NOT NULL DEFAULT timezone('UTC', now())
        );
      $create_placeholder$;

      COMMENT ON TABLE public.boleta_placeholder IS
        'Placeholder temporal mientras se modela la tabla boleta real; migrar registros a la tabla final cuando exista';
    END IF;
  END IF;

  EXECUTE $ddl$
    CREATE TABLE IF NOT EXISTS public.pago (
      pago_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      playa_id uuid NOT NULL,
      numero_pago integer NOT NULL,
      ocupacion_id uuid,
      fecha_hora_pago timestamptz NOT NULL DEFAULT timezone('UTC', now()),
      monto_pago numeric(12, 2) NOT NULL CHECK (monto_pago > 0),
      metodo_pago metodo_pago NOT NULL,
      playero_id uuid NOT NULL,
      turno_fecha_hora_ingreso timestamptz NOT NULL,
      fecha_hora_ingreso timestamptz NOT NULL DEFAULT timezone('UTC', now()),
      observaciones text,
      CONSTRAINT uq_pago_playa_numero UNIQUE (playa_id, numero_pago),
      CONSTRAINT pago_turno_fk
        FOREIGN KEY (playa_id, playero_id, turno_fecha_hora_ingreso)
        REFERENCES public.turno(playa_id, playero_id, fecha_hora_ingreso)
        DEFERRABLE INITIALLY IMMEDIATE,
      CONSTRAINT pago_metodo_fk
        FOREIGN KEY (playa_id, metodo_pago)
        REFERENCES public.metodo_pago_playa(playa_id, metodo_pago)
        DEFERRABLE INITIALLY IMMEDIATE,
      CONSTRAINT pago_ocupacion_fk
        FOREIGN KEY (ocupacion_id)
        REFERENCES public.ocupacion(ocupacion_id)
        DEFERRABLE INITIALLY DEFERRED
    );
  $ddl$;
END;
$pago$;

COMMENT ON TABLE public.pago IS 'Cobros registrados en Supabase. Cada registro pertenece a una playa y referencia ocupación o boleta.';
COMMENT ON COLUMN public.pago.playa_id IS 'Playa asociada al pago, usada para generar numeración correlativa.';
COMMENT ON COLUMN public.pago.numero_pago IS 'Numeración incremental por playa, calculada con locks para evitar duplicados.';
COMMENT ON COLUMN public.pago.ocupacion_id IS 'Referencia a ocupación (para pagos de ocupaciones esporádicas).';
COMMENT ON COLUMN public.pago.monto_pago IS 'Importe cobrado al cliente, almacenado con precisión de 2 decimales.';
COMMENT ON COLUMN public.pago.metodo_pago IS 'Método de pago autorizado para la playa.';
COMMENT ON COLUMN public.pago.playero_id IS 'Playero (o dueño actuando como tal) que registró el cobro.';
COMMENT ON COLUMN public.pago.turno_fecha_hora_ingreso IS 'Timestamp del turno activo utilizado para este cobro.';
COMMENT ON COLUMN public.pago.fecha_hora_ingreso IS 'Timestamp en UTC del momento en que se registró el pago.';
COMMENT ON COLUMN public.pago.observaciones IS 'Notas opcionales visibles en el panel administrativo.';

CREATE INDEX IF NOT EXISTS idx_pago_turno_fk
  ON public.pago (playa_id, playero_id, turno_fecha_hora_ingreso);

CREATE INDEX IF NOT EXISTS idx_pago_ocupacion
  ON public.pago (ocupacion_id)
  WHERE ocupacion_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_pago_metodo
  ON public.pago (playa_id, metodo_pago);

COMMENT ON INDEX idx_pago_turno_fk IS 'Optimiza joins para auditoría de pagos por turno.';
COMMENT ON INDEX idx_pago_ocupacion IS 'Permite resolver ocupación->pago sin escanear toda la tabla.';
COMMENT ON INDEX idx_pago_metodo IS 'Soporta reportes por método de pago y filtros combinados.';

-- Agregar FK ocupacion(playa_id, numero_pago) -> pago(playa_id, numero_pago)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ocupacion_pago_fk'
  ) THEN
    ALTER TABLE public.ocupacion
      ADD CONSTRAINT ocupacion_pago_fk
      FOREIGN KEY (playa_id, numero_pago)
      REFERENCES public.pago(playa_id, numero_pago)
      DEFERRABLE INITIALLY DEFERRED;
  END IF;
END;
$$;

-- -----------------------------------------------------------------------------
-- Tabla de eventos para observabilidad
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pago_event_log (
  pago_event_log_id bigserial PRIMARY KEY,
  pago_id uuid NOT NULL,
  evento text NOT NULL,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('UTC', now()),
  CONSTRAINT pago_event_log_fk
    FOREIGN KEY (pago_id)
    REFERENCES public.pago(pago_id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_pago_event_log_pago_id
  ON public.pago_event_log (pago_id, created_at DESC);

COMMENT ON TABLE public.pago_event_log IS 'Bitácora liviana para depurar flujos de cobro y detectar fallos.';
COMMENT ON COLUMN public.pago_event_log.evento IS 'Etiqueta corta del evento registrado (SUCCESS, ERROR, etc.).';

-- -----------------------------------------------------------------------------
-- Seguridad (RLS + Grants)
-- -----------------------------------------------------------------------------
ALTER TABLE public.pago ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pago_event_log ENABLE ROW LEVEL SECURITY;

-- Playeros (y dueños actuando como playeros) solo ven pagos de su turno activo
DROP POLICY IF EXISTS "playeros_ven_sus_pagos_en_turno" ON public.pago;
CREATE POLICY "playeros_ven_sus_pagos_en_turno"
  ON public.pago
  FOR SELECT
  TO authenticated
  USING (
    playero_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.turno t
      WHERE t.playa_id = pago.playa_id
        AND t.playero_id = auth.uid()
        AND t.fecha_hora_ingreso = pago.turno_fecha_hora_ingreso
        AND t.fecha_hora_salida IS NULL
    )
  );

-- Playeros solo insertan pagos cuando el turno está abierto
DROP POLICY IF EXISTS "playeros_insertan_pagos_con_turno_activo" ON public.pago;
CREATE POLICY "playeros_insertan_pagos_con_turno_activo"
  ON public.pago
  FOR INSERT
  TO authenticated
  WITH CHECK (
    playero_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.turno t
      WHERE t.playa_id = pago.playa_id
        AND t.playero_id = auth.uid()
        AND t.fecha_hora_ingreso = pago.turno_fecha_hora_ingreso
        AND t.fecha_hora_salida IS NULL
    )
  );

-- Dueños pueden auditar todos los pagos de sus playas
DROP POLICY IF EXISTS "duenos_ven_pagos_de_sus_playas" ON public.pago;
CREATE POLICY "duenos_ven_pagos_de_sus_playas"
  ON public.pago
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.playa p
      WHERE p.playa_id = pago.playa_id
        AND p.playa_dueno_id = auth.uid()
    )
  );

-- Service role (y supabase funciones internas) full access
DROP POLICY IF EXISTS "service_role_full_access_pagos" ON public.pago;
CREATE POLICY "service_role_full_access_pagos"
  ON public.pago
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Solo el service role puede leer/escribir eventos (evita exposición a clientes)
DROP POLICY IF EXISTS "service_role_full_access_pago_event_log" ON public.pago_event_log;
CREATE POLICY "service_role_full_access_pago_event_log"
  ON public.pago_event_log
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

GRANT SELECT, INSERT ON public.pago TO authenticated;
GRANT ALL ON public.pago TO service_role;

GRANT ALL ON public.pago_event_log TO service_role;

COMMIT;

-- ===================================================================================
-- DOWN MIGRATION (manual)
-- Para revertir:
--   1. ALTER TABLE public.ocupacion DROP CONSTRAINT IF EXISTS ocupacion_pago_fk;
--   2. DROP TABLE IF EXISTS public.pago_event_log CASCADE;
--   3. DROP TABLE IF EXISTS public.pago CASCADE;
--   4. DROP TABLE IF EXISTS public.boleta_placeholder CASCADE;
-- ===================================================================================
