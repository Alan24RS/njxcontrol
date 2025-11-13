-- Permitir que cualquier playero pueda editar ocupaciones creadas por otros playeros de la misma playa
-- Esto facilita la colaboración entre playeros sin restricciones de "creador"

-- Primero eliminamos la política restrictiva anterior
DROP POLICY IF EXISTS "Playeros pueden actualizar sus ocupaciones" ON public.ocupacion;

-- Creamos la nueva política que permite a cualquier playero de la playa editar cualquier ocupación de esa playa
CREATE POLICY "Playeros pueden actualizar ocupaciones de su playa"
    ON public.ocupacion
    FOR UPDATE
    TO public
    USING (
        -- El usuario debe ser playero de la playa donde está la ocupación
        EXISTS (
            SELECT 1
            FROM public.playero_playa pp
            WHERE pp.playero_id = auth.uid()
            AND pp.playa_id = ocupacion.playa_id
        )
    )
    WITH CHECK (
        -- Misma validación para el WITH CHECK
        EXISTS (
            SELECT 1
            FROM public.playero_playa pp
            WHERE pp.playero_id = auth.uid()
            AND pp.playa_id = ocupacion.playa_id
        )
    );

-- Nota: Los dueños ya tienen su propia política que les permite actualizar ocupaciones
-- de sus playas, así que no necesitamos modificar esa política.
