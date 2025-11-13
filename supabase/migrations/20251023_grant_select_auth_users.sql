-- Otorga permisos de SELECT sobre auth.users al rol authenticated
GRANT SELECT ON TABLE auth.users TO authenticated;

-- (Opcional) Si quieres que el rol anon también tenga acceso, descomenta la siguiente línea:
-- GRANT SELECT ON TABLE auth.users TO anon;
