-- ===================================================================================
-- MIGRACIÓN: Agregar columna boleta_id a tabla pago
-- Descripción:
--   Agrega la columna boleta_id a la tabla pago para permitir la asociación
--   de pagos con boletas de abonos. Esta columna es nullable ya que un pago
--   puede estar asociado a una ocupación esporádica O a una boleta de abono.
-- 
--   La función finalizar_ocupacion_y_registrar_pago requiere esta columna
--   para funcionar correctamente.
-- ===================================================================================

BEGIN;

-- Agregar columna boleta_id a la tabla pago
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'pago'
      AND column_name = 'boleta_id'
  ) THEN
    ALTER TABLE public.pago
      ADD COLUMN boleta_id uuid;

    COMMENT ON COLUMN public.pago.boleta_id IS 
      'Referencia a boleta (para pagos de abonos). NULL si el pago es de una ocupación esporádica.';
  END IF;
END $$;

-- Migrar datos existentes de relación compuesta a relación simple
-- Si existen pagos con relación compuesta a boleta, migrarlos a boleta_id
DO $$
BEGIN
  UPDATE public.pago
  SET boleta_id = (
    SELECT b.boleta_id
    FROM public.boleta b
    WHERE b.playa_id = pago.playa_id_boleta
      AND b.plaza_id = pago.plaza_id_boleta
      AND b.fecha_hora_inicio_abono = pago.fecha_hora_inicio_abono
      AND b.fecha_generacion_boleta = pago.fecha_generacion_boleta
    LIMIT 1
  )
  WHERE boleta_id IS NULL
    AND playa_id_boleta IS NOT NULL
    AND plaza_id_boleta IS NOT NULL
    AND fecha_hora_inicio_abono IS NOT NULL
    AND fecha_generacion_boleta IS NOT NULL
    AND ocupacion_id IS NULL;
END $$;

-- Agregar foreign key a boleta o boleta_placeholder según lo que exista
DO $$
DECLARE
  target_boleta text;
  boleta_has_uuid_pk boolean;
BEGIN
  -- Verificar si existe la tabla boleta con columna boleta_id
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
  END IF;

  -- Agregar foreign key si no existe
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'pago_boleta_fk'
  ) THEN
    EXECUTE format($fk$
      ALTER TABLE public.pago
        ADD CONSTRAINT pago_boleta_fk
        FOREIGN KEY (boleta_id)
        REFERENCES public.%I(boleta_id)
        DEFERRABLE INITIALLY DEFERRED
    $fk$, target_boleta);
  END IF;
END $$;

-- Crear índice para mejorar consultas por boleta_id
CREATE INDEX IF NOT EXISTS idx_pago_boleta
  ON public.pago (boleta_id)
  WHERE boleta_id IS NOT NULL;

COMMENT ON INDEX idx_pago_boleta IS 
  'Optimiza consultas de pagos asociados a una boleta específica.';

-- Eliminar constraint antiguo si existe (pago_xor_updated)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'pago_xor_updated'
  ) THEN
    ALTER TABLE public.pago
      DROP CONSTRAINT pago_xor_updated;
  END IF;
END $$;

-- Limpiar datos inválidos antes de agregar el constraint
DO $$
DECLARE
  both_null_count integer;
  both_not_null_count integer;
BEGIN
  -- Contar filas con ambas referencias NULL
  SELECT COUNT(*) INTO both_null_count
  FROM public.pago
  WHERE ocupacion_id IS NULL AND boleta_id IS NULL;
  
  -- Contar filas con ambas referencias NOT NULL
  SELECT COUNT(*) INTO both_not_null_count
  FROM public.pago
  WHERE ocupacion_id IS NOT NULL AND boleta_id IS NOT NULL;
  
  -- Para filas con ambas NOT NULL, mantener solo ocupacion_id (prioridad)
  IF both_not_null_count > 0 THEN
    RAISE NOTICE 'Found % rows with both ocupacion_id and boleta_id. Keeping only ocupacion_id.', both_not_null_count;
    UPDATE public.pago
    SET boleta_id = NULL
    WHERE ocupacion_id IS NOT NULL AND boleta_id IS NOT NULL;
  END IF;
  
  -- Para filas con ambas NULL, intentar asociarlas usando la relación compuesta si existe
  IF both_null_count > 0 THEN
    RAISE NOTICE 'Found % rows with both ocupacion_id and boleta_id NULL. Attempting to migrate from composite relationship.', both_null_count;
    
    -- Intentar migrar desde relación compuesta si existe
    UPDATE public.pago
    SET boleta_id = (
      SELECT b.boleta_id
      FROM public.boleta b
      WHERE b.playa_id = pago.playa_id_boleta
        AND b.plaza_id = pago.plaza_id_boleta
        AND b.fecha_hora_inicio_abono = pago.fecha_hora_inicio_abono
        AND b.fecha_generacion_boleta = pago.fecha_generacion_boleta
      LIMIT 1
    )
    WHERE ocupacion_id IS NULL 
      AND boleta_id IS NULL
      AND playa_id_boleta IS NOT NULL
      AND plaza_id_boleta IS NOT NULL
      AND fecha_hora_inicio_abono IS NOT NULL
      AND fecha_generacion_boleta IS NOT NULL;
  END IF;
END $$;

-- Agregar constraint CHECK para asegurar que al menos una de las dos referencias existe
DO $$
DECLARE
  invalid_rows_count integer;
BEGIN
  -- Verificar si hay filas que violan el constraint antes de agregarlo
  SELECT COUNT(*) INTO invalid_rows_count
  FROM public.pago
  WHERE (ocupacion_id IS NULL AND boleta_id IS NULL)
     OR (ocupacion_id IS NOT NULL AND boleta_id IS NOT NULL);
  
  IF invalid_rows_count > 0 THEN
    RAISE EXCEPTION 'Cannot add constraint: % rows violate the constraint. Please clean up data first.', invalid_rows_count;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'pago_check_ocupacion_or_boleta'
  ) THEN
    ALTER TABLE public.pago
      ADD CONSTRAINT pago_check_ocupacion_or_boleta
      CHECK (
        (ocupacion_id IS NOT NULL AND boleta_id IS NULL) OR
        (ocupacion_id IS NULL AND boleta_id IS NOT NULL)
      );
    
    COMMENT ON CONSTRAINT pago_check_ocupacion_or_boleta ON public.pago IS
      'Asegura que un pago esté asociado exactamente a una ocupación O a una boleta, pero no a ambas.';
  END IF;
END $$;

COMMIT;

-- ===================================================================================
-- ROLLBACK (si es necesario):
-- 
-- BEGIN;
-- ALTER TABLE public.pago DROP CONSTRAINT IF EXISTS pago_check_ocupacion_or_boleta;
-- DROP INDEX IF EXISTS idx_pago_boleta;
-- ALTER TABLE public.pago DROP CONSTRAINT IF EXISTS pago_boleta_fk;
-- ALTER TABLE public.pago DROP COLUMN IF EXISTS boleta_id;
-- COMMIT;
-- ===================================================================================
