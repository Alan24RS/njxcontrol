ALTER TABLE playa ENABLE ROW LEVEL SECURITY;

CREATE POLICY "duenos_ven_sus_propias_playas"
ON playa
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM rol_usuario
    WHERE usuario_id = auth.uid()
    AND rol = 'DUENO'
  )
  AND playa_dueno_id = auth.uid()
);

CREATE POLICY "duenos_gestionan_sus_propias_playas"
ON playa
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM rol_usuario
    WHERE usuario_id = auth.uid()
    AND rol = 'DUENO'
  )
  AND playa_dueno_id = auth.uid()
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM rol_usuario
    WHERE usuario_id = auth.uid()
    AND rol = 'DUENO'
  )
  AND playa_dueno_id = auth.uid()
);
