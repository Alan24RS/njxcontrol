-- Migration: Allow owners to update playero user info (nombre, telefono)
-- Created: 2025-10-22
-- Purpose: Add a RLS policy that permits authenticated "dueno" users to UPDATE
-- the `public.usuario` row for a playero when the dueno is the inviter/owner
-- of at least one playero_playa relation for that playero.

-- Ensure RLS is enabled on the table (should already be enabled by migrations,
-- but idempotent enable is safe).
ALTER TABLE IF EXISTS public.usuario ENABLE ROW LEVEL SECURITY;

-- Create the policy safely (idempotent): owners who invited the playero can UPDATE the usuario row
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy p
    JOIN pg_class c ON p.polrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE c.relname = 'usuario' AND n.nspname = 'public' AND p.polname = 'duenos_pueden_actualizar_playeros'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY duenos_pueden_actualizar_playeros
      ON public.usuario
      FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.playero_playa pp
          WHERE pp.playero_id = public.usuario.usuario_id
            AND pp.dueno_invitador_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.playero_playa pp
          WHERE pp.playero_id = public.usuario.usuario_id
            AND pp.dueno_invitador_id = auth.uid()
        )
      );
    $policy$;

    EXECUTE $policy_comment$
      COMMENT ON POLICY duenos_pueden_actualizar_playeros ON public.usuario
      IS 'Permite a dueños que invitaron/asignaron a un playero actualizar su fila usuario (nombre/telefono)';
    $policy_comment$;
  END IF;
END;
$$ LANGUAGE plpgsql;
