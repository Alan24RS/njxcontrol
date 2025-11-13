ALTER TABLE usuario ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  CREATE POLICY "users_see_own_profile"
  ON usuario
  FOR SELECT
  TO authenticated
  USING (
    usuario_id = auth.uid()
  );
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "duenos_see_their_playeros_info"
  ON usuario
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM playero_playa pp
      WHERE pp.playero_id = usuario.usuario_id
      AND pp.dueno_invitador_id = auth.uid()
    )
  );
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "users_can_update_own_profile"
  ON usuario
  FOR UPDATE
  TO authenticated
  USING (
    usuario_id = auth.uid()
  )
  WITH CHECK (
    usuario_id = auth.uid()
  );
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;

COMMENT ON POLICY "users_see_own_profile" ON usuario IS 
'Permite que los usuarios vean su propia información de perfil';

COMMENT ON POLICY "duenos_see_their_playeros_info" ON usuario IS 
'Permite que los dueños vean la información de los usuarios que son sus playeros invitados';

COMMENT ON POLICY "users_can_update_own_profile" ON usuario IS 
'Permite que los usuarios actualicen su propia información de perfil';

ALTER TABLE rol_usuario ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  CREATE POLICY "users_see_own_roles"
  ON rol_usuario
  FOR SELECT
  TO authenticated
  USING (
    usuario_id = auth.uid()
  );
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "duenos_see_their_playeros_roles"
  ON rol_usuario
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM playero_playa pp
      WHERE pp.playero_id = rol_usuario.usuario_id
      AND pp.dueno_invitador_id = auth.uid()
    )
  );
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;

COMMENT ON POLICY "users_see_own_roles" ON rol_usuario IS 
'Permite que los usuarios vean sus propios roles';

COMMENT ON POLICY "duenos_see_their_playeros_roles" ON rol_usuario IS 
'Permite que los dueños vean los roles de sus playeros invitados';

