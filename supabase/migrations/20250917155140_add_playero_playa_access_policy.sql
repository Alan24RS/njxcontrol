-- =====================================================
-- MIGRACIÓN: PERMITIR ACCESO DE PLAYEROS A SUS PLAYAS ASIGNADAS
-- =====================================================
-- Agregar política RLS para que playeros puedan ver las playas donde están asignados

-- Política para que playeros puedan ver las playas donde están asignados como playeros activos
CREATE POLICY "playeros_ven_sus_playas_asignadas" ON public.playa
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.playero_playa pp
            WHERE pp.playa_id = playa.playa_id
            AND pp.playero_id = auth.uid()
            AND pp.estado = 'ACTIVO'
        )
    );

-- Comentario explicativo
COMMENT ON POLICY "playeros_ven_sus_playas_asignadas" ON public.playa IS 
'Permite que los playeros vean las playas donde están asignados como playeros activos';
