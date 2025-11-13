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

  IF has_abono THEN
    RAISE NOTICE 'ABONO ya existe (reemplazó a MENSUAL), saltando migración...';
    RETURN;
  END IF;

  IF NOT has_mensual THEN
    RAISE NOTICE 'Agregando MENSUAL al enum (será renombrado a ABONO en migración posterior)';
    ALTER TYPE modalidad_ocupacion ADD VALUE IF NOT EXISTS 'MENSUAL';
  ELSE
    RAISE NOTICE 'MENSUAL ya existe, saltando...';
  END IF;
END $$;
