ALTER TABLE plaza ENABLE ROW LEVEL SECURITY;

CREATE POLICY "duenos_gestionan_plazas_de_sus_playas"
ON plaza
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM playa
    WHERE playa.playa_id = plaza.playa_id
    AND playa.playa_dueno_id = auth.uid()
    AND playa.fecha_eliminacion IS NULL
  )
  AND plaza.fecha_eliminacion IS NULL
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM playa
    WHERE playa.playa_id = plaza.playa_id
    AND playa.playa_dueno_id = auth.uid()
    AND playa.fecha_eliminacion IS NULL
  )
);

CREATE POLICY "playeros_ven_plazas_de_sus_playas_asignadas"
ON plaza
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM playero_playa
    WHERE playero_playa.playa_id = plaza.playa_id
    AND playero_playa.playero_id = auth.uid()
    AND playero_playa.estado = 'ACTIVO'
  )
  AND plaza.fecha_eliminacion IS NULL
);

COMMENT ON POLICY "duenos_gestionan_plazas_de_sus_playas" ON plaza IS 
'Permite que los dueños vean y gestionen todas las plazas de sus propias playas';

COMMENT ON POLICY "playeros_ven_plazas_de_sus_playas_asignadas" ON plaza IS 
'Permite que los playeros vean las plazas de las playas donde están asignados como playeros activos';

