-- Agrega el estado 'FINALIZADO' al enum public.ocupacion_estado para permitir marcar ocupaciones finalizadas.
--
-- Notas:
-- - ALTER TYPE ADD VALUE no admite cláusulas DOWN; si se necesita revertir,
--   es necesario recrear el tipo sin el valor agregado.

DO $$
BEGIN
    -- Crea el enum si no existe (ambientes nuevos)
    CREATE TYPE public.ocupacion_estado AS ENUM ('ACTIVO');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END
$$;

ALTER TYPE public.ocupacion_estado
    ADD VALUE IF NOT EXISTS 'FINALIZADO';
