-- =====================================================
-- MIGRACIÓN: ARREGLAR POLÍTICAS RLS PARA EL TRIGGER
-- =====================================================
-- Las políticas RLS actuales bloquean el trigger handle_new_user
-- porque requieren auth.uid() que no está disponible durante la creación del usuario

-- 1. Agregar política para permitir inserción desde el trigger en tabla usuario
CREATE POLICY "trigger_can_create_user" ON public.usuario
    FOR INSERT 
    WITH CHECK (true);

-- 2. Agregar política para permitir inserción desde el trigger en tabla rol_usuario  
CREATE POLICY "trigger_can_assign_role" ON public.rol_usuario
    FOR INSERT 
    WITH CHECK (true);

-- 3. Agregar política para permitir inserción desde el trigger en tabla playero_playa
CREATE POLICY "trigger_can_create_playero_playa" ON public.playero_playa
    FOR INSERT 
    WITH CHECK (true);

-- 4. Agregar política para permitir actualización desde el trigger en tabla playero_invitacion
CREATE POLICY "trigger_can_update_invitation" ON public.playero_invitacion
    FOR UPDATE 
    USING (true)
    WITH CHECK (true);

-- 5. Comentarios explicativos
COMMENT ON POLICY "trigger_can_create_user" ON public.usuario IS 
'Permite al trigger handle_new_user crear usuarios durante el signup';

COMMENT ON POLICY "trigger_can_assign_role" ON public.rol_usuario IS 
'Permite al trigger handle_new_user asignar roles durante el signup';

COMMENT ON POLICY "trigger_can_create_playero_playa" ON public.playero_playa IS 
'Permite al trigger handle_new_user crear relaciones playero-playa durante signup de playeros invitados';

COMMENT ON POLICY "trigger_can_update_invitation" ON public.playero_invitacion IS 
'Permite al trigger handle_new_user marcar invitaciones como aceptadas durante signup de playeros';
