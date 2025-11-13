-- =====================================================
-- MIGRACIÓN: CORRECCIÓN DE SEARCH_PATH EN FUNCIONES RESTANTES
-- =====================================================
-- Corrige las firmas incorrectas de las funciones que aún tienen search_path mutable

DO $$
BEGIN
  ALTER FUNCTION public.aceptar_invitacion_usuario_existente(text, uuid) SET search_path = public;
EXCEPTION WHEN undefined_function THEN NULL;
END $$;

DO $$
BEGIN
  ALTER FUNCTION public.aprobar_playero(uuid, uuid, uuid) SET search_path = public;
EXCEPTION WHEN undefined_function THEN NULL;
END $$;

DO $$
BEGIN
  ALTER FUNCTION public.create_complete_playa_setup(jsonb, jsonb, jsonb, jsonb, jsonb, jsonb) SET search_path = public;
EXCEPTION WHEN undefined_function THEN NULL;
END $$;

