-- =====================================================
-- MIGRACIÓN: ARREGLAR RESTRICCIÓN DE INVITACIONES EXPIRADAS
-- =====================================================
-- Permite eliminar invitaciones expiradas físicamente y modifica restricciones

-- 1. Función para eliminar físicamente invitaciones expiradas de un email específico
CREATE OR REPLACE FUNCTION public.limpiar_invitaciones_expiradas_email(
    p_email text,
    p_dueno_id uuid DEFAULT auth.uid()
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_deleted_count integer;
BEGIN
    -- Eliminar físicamente invitaciones expiradas para permitir crear nuevas
    DELETE FROM public.playero_invitacion 
    WHERE email = p_email 
    AND dueno_invitador_id = p_dueno_id
    AND estado = 'EXPIRADA';
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    RETURN json_build_object(
        'success', true,
        'deleted_count', v_deleted_count,
        'message', format('Se eliminaron %s invitaciones expiradas para %s', v_deleted_count, p_email)
    );
END;
$$;

-- 2. Modificar la restricción para permitir múltiples invitaciones expiradas
-- pero solo una pendiente por email-dueño
ALTER TABLE public.playero_invitacion DROP CONSTRAINT IF EXISTS unique_email_dueno_pending;

-- Crear nueva restricción que solo aplique a invitaciones PENDIENTES
CREATE UNIQUE INDEX unique_email_dueno_pending_only 
ON public.playero_invitacion (email, dueno_invitador_id) 
WHERE estado = 'PENDIENTE';

-- 3. Limpiar las invitaciones expiradas existentes para el email problemático
DELETE FROM public.playero_invitacion 
WHERE email = 'reactiontimeshop@gmail.com' 
AND estado = 'EXPIRADA';

-- 4. Otorgar permisos
GRANT EXECUTE ON FUNCTION public.limpiar_invitaciones_expiradas_email(text, uuid) TO authenticated;
