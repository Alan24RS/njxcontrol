-- =====================================================
-- MIGRACIÓN: VISTA UNIFICADA USER + ROLES
-- =====================================================
-- Crea una vista que une los datos del usuario de auth.users con sus roles

-- Vista unificada para obtener usuario con roles en una sola query
CREATE OR REPLACE VIEW v_user_with_roles AS
SELECT 
  u.id as usuario_id,
  u.email,
  u.raw_user_meta_data->>'name' as nombre,
  u.raw_user_meta_data->>'phone' as telefono,
  COALESCE(
    array_agg(ru.rol) FILTER (WHERE ru.rol IS NOT NULL),
    ARRAY[]::public.rol[]
  ) as roles,
  u.created_at as fecha_creacion,
  u.updated_at as fecha_modificacion
FROM auth.users u
LEFT JOIN public.rol_usuario ru ON u.id = ru.usuario_id
WHERE u.id = auth.uid() -- Solo el usuario autenticado puede ver sus propios datos
GROUP BY u.id, u.email, u.raw_user_meta_data, u.created_at, u.updated_at;

-- Habilitar RLS en la vista
ALTER VIEW v_user_with_roles SET (security_invoker = true);

-- Comentario para documentación
COMMENT ON VIEW v_user_with_roles IS 'Vista unificada que combina datos del usuario de auth.users con sus roles de rol_usuario. Optimizada para reducir queries de autenticación de 2 a 1.';

-- Función auxiliar para obtener el usuario autenticado con roles
CREATE OR REPLACE FUNCTION get_authenticated_user_with_roles()
RETURNS TABLE (
  usuario_id uuid,
  email text,
  nombre text,
  telefono text,
  roles public.rol[]
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT 
    v.usuario_id,
    v.email,
    v.nombre,
    v.telefono,
    v.roles
  FROM v_user_with_roles v
  WHERE v.usuario_id = auth.uid();
$$;

-- Comentario para la función
COMMENT ON FUNCTION get_authenticated_user_with_roles() IS 'Función optimizada que retorna el usuario autenticado con sus roles en una sola query, reemplazando las 2 queries separadas de auth.getUser() + rol_usuario.';
