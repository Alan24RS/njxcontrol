-- Habilitar RLS en la tabla playero_playa
ALTER TABLE playero_playa ENABLE ROW LEVEL SECURITY;

-- Política para que los dueños solo vean las relaciones de playeros que ellos invitaron
CREATE POLICY "duenos_ven_sus_playeros_invitados" ON playero_playa
    FOR ALL
    TO authenticated
    USING (
        dueno_invitador_id = auth.uid()
    )
    WITH CHECK (
        dueno_invitador_id = auth.uid()
    );

-- Política para que los playeros solo vean sus propias relaciones con playas
CREATE POLICY "playeros_ven_sus_propias_relaciones" ON playero_playa
    FOR SELECT
    TO authenticated
    USING (
        playero_id = auth.uid()
    );

-- Política para permitir que los playeros actualicen su propio estado (por ejemplo, darse de baja)
CREATE POLICY "playeros_actualizan_su_estado" ON playero_playa
    FOR UPDATE
    TO authenticated
    USING (
        playero_id = auth.uid()
    )
    WITH CHECK (
        playero_id = auth.uid()
    );
