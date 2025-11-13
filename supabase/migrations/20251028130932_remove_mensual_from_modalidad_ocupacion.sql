DO $$
DECLARE
  has_mensual BOOLEAN;
  has_abono BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'modalidad_ocupacion' AND e.enumlabel = 'MENSUAL'
  ) INTO has_mensual;

  SELECT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'modalidad_ocupacion' AND e.enumlabel = 'ABONO'
  ) INTO has_abono;

  IF NOT has_mensual AND has_abono THEN
    RAISE NOTICE 'Migración ya aplicada (MENSUAL -> ABONO), saltando...';
    RETURN;
  END IF;

  IF NOT has_mensual AND NOT has_abono THEN
    RAISE NOTICE 'MENSUAL no existe y ABONO tampoco, estado correcto para esta migración (POR_HORA, DIARIA, SEMANAL)';
    RETURN;
  END IF;

  IF has_mensual THEN
    RAISE NOTICE 'Esta migración será manejada por el hotfix posterior, saltando...';
    RETURN;
  END IF;
END $$;
