-- =====================================================
-- MIGRACIÓN: CORRECCIÓN DE ERRORES DE SEGURIDAD DEL LINTER
-- =====================================================
-- Corrige los errores reportados por el linter de Supabase:
-- 1. Vistas con SECURITY DEFINER -> security_invoker = true
-- 2. Vista v_user_with_roles expone auth.users -> usar public.usuario
-- 3. Habilitar RLS en tablas que no lo tienen
-- 4. Crear políticas RLS apropiadas

-- =====================================================
-- 1. CORREGIR VISTAS CON SECURITY DEFINER
-- =====================================================

-- Corregir v_user_with_roles: NO debe exponer auth.users directamente
-- En su lugar, usar public.usuario que ya tiene RLS
DROP VIEW IF EXISTS public.v_user_with_roles CASCADE;

CREATE OR REPLACE VIEW public.v_user_with_roles AS
SELECT 
  u.usuario_id,
  u.email,
  u.nombre,
  u.telefono,
  COALESCE(
    array_agg(ru.rol) FILTER (WHERE ru.rol IS NOT NULL),
    ARRAY[]::public.rol[]
  ) as roles,
  u.fecha_creacion,
  u.fecha_modificacion
FROM public.usuario u
LEFT JOIN public.rol_usuario ru ON u.usuario_id = ru.usuario_id
WHERE u.usuario_id = auth.uid()
GROUP BY u.usuario_id, u.email, u.nombre, u.telefono, u.fecha_creacion, u.fecha_modificacion;

ALTER VIEW public.v_user_with_roles SET (security_invoker = true);

COMMENT ON VIEW public.v_user_with_roles IS 'Vista unificada que combina datos del usuario de public.usuario con sus roles. Usa security_invoker=true para respetar las políticas RLS de las tablas base. NO expone auth.users directamente.';

-- Corregir playa_publica: usar security_invoker en lugar de SECURITY DEFINER
ALTER VIEW public.playa_publica SET (security_invoker = true);

COMMENT ON VIEW public.playa_publica IS 'Vista pública de playas activas visibles para todos. Usa security_invoker=true para respetar las políticas RLS de las tablas base.';

-- Corregir v_metodos_pago_playa: usar security_invoker
ALTER VIEW public.v_metodos_pago_playa SET (security_invoker = true);

COMMENT ON VIEW public.v_metodos_pago_playa IS 'Vista de métodos de pago por playa con etiquetas legibles. Usa security_invoker=true para respetar las políticas RLS de las tablas base.';

-- Corregir v_boletas: usar security_invoker
ALTER VIEW public.v_boletas SET (security_invoker = true);

COMMENT ON VIEW public.v_boletas IS 'Vista enriquecida de boletas con información de abonado, plaza y estado calculado. Usa security_invoker=true para respetar las políticas RLS de las tablas base.';

-- Corregir v_modalidades_ocupacion: usar security_invoker
ALTER VIEW public.v_modalidades_ocupacion SET (security_invoker = true);

COMMENT ON VIEW public.v_modalidades_ocupacion IS 'Vista de modalidades de ocupación con nombre traducido. Usa security_invoker=true para respetar las políticas RLS de las tablas base.';

-- Corregir v_tarifas: usar security_invoker
ALTER VIEW public.v_tarifas SET (security_invoker = true);

COMMENT ON VIEW public.v_tarifas IS 'Vista de tarifas con información relacionada de tipo de plaza. Usa security_invoker=true para respetar las políticas RLS de las tablas base.';

-- =====================================================
-- 2. HABILITAR RLS EN TABLAS QUE NO LO TIENEN
-- =====================================================

-- Habilitar RLS en ciudad (tabla de referencia pública)
ALTER TABLE public.ciudad ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS en caracteristica (tabla de referencia pública)
ALTER TABLE public.caracteristica ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS en tipo_plaza
ALTER TABLE public.tipo_plaza ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS en tipo_plaza_caracteristica
ALTER TABLE public.tipo_plaza_caracteristica ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS en modalidad_ocupacion_playa
ALTER TABLE public.modalidad_ocupacion_playa ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS en metodo_pago_playa
ALTER TABLE public.metodo_pago_playa ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS en tipo_vehiculo_playa
ALTER TABLE public.tipo_vehiculo_playa ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS en tarifa
ALTER TABLE public.tarifa ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 3. CREAR POLÍTICAS RLS PARA CADA TABLA
-- =====================================================

-- Políticas para ciudad (pública, todos pueden leer)
DROP POLICY IF EXISTS "ciudad_select_public" ON public.ciudad;
CREATE POLICY "ciudad_select_public"
ON public.ciudad
FOR SELECT
TO public
USING (true);

-- Políticas para caracteristica (pública, todos pueden leer)
DROP POLICY IF EXISTS "caracteristica_select_public" ON public.caracteristica;
CREATE POLICY "caracteristica_select_public"
ON public.caracteristica
FOR SELECT
TO public
USING (true);

-- Políticas para tipo_plaza (dueños y playeros ven sus tipos de plaza)
DROP POLICY IF EXISTS "tipo_plaza_select_dueno" ON public.tipo_plaza;
CREATE POLICY "tipo_plaza_select_dueno"
ON public.tipo_plaza
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.playa p
    WHERE p.playa_id = tipo_plaza.playa_id
    AND p.playa_dueno_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "tipo_plaza_select_playero" ON public.tipo_plaza;
CREATE POLICY "tipo_plaza_select_playero"
ON public.tipo_plaza
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.playero_playa pp
    WHERE pp.playa_id = tipo_plaza.playa_id
    AND pp.playero_id = auth.uid()
    AND pp.estado = 'ACTIVO'
  )
);

DROP POLICY IF EXISTS "tipo_plaza_insert_dueno" ON public.tipo_plaza;
CREATE POLICY "tipo_plaza_insert_dueno"
ON public.tipo_plaza
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.playa p
    WHERE p.playa_id = tipo_plaza.playa_id
    AND p.playa_dueno_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "tipo_plaza_update_dueno" ON public.tipo_plaza;
CREATE POLICY "tipo_plaza_update_dueno"
ON public.tipo_plaza
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.playa p
    WHERE p.playa_id = tipo_plaza.playa_id
    AND p.playa_dueno_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.playa p
    WHERE p.playa_id = tipo_plaza.playa_id
    AND p.playa_dueno_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "tipo_plaza_delete_dueno" ON public.tipo_plaza;
CREATE POLICY "tipo_plaza_delete_dueno"
ON public.tipo_plaza
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.playa p
    WHERE p.playa_id = tipo_plaza.playa_id
    AND p.playa_dueno_id = auth.uid()
  )
);

-- Políticas para tipo_plaza_caracteristica
DROP POLICY IF EXISTS "tipo_plaza_caracteristica_select_dueno" ON public.tipo_plaza_caracteristica;
CREATE POLICY "tipo_plaza_caracteristica_select_dueno"
ON public.tipo_plaza_caracteristica
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.playa p
    WHERE p.playa_id = tipo_plaza_caracteristica.playa_id
    AND p.playa_dueno_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "tipo_plaza_caracteristica_select_playero" ON public.tipo_plaza_caracteristica;
CREATE POLICY "tipo_plaza_caracteristica_select_playero"
ON public.tipo_plaza_caracteristica
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.playero_playa pp
    WHERE pp.playa_id = tipo_plaza_caracteristica.playa_id
    AND pp.playero_id = auth.uid()
    AND pp.estado = 'ACTIVO'
  )
);

DROP POLICY IF EXISTS "tipo_plaza_caracteristica_insert_dueno" ON public.tipo_plaza_caracteristica;
CREATE POLICY "tipo_plaza_caracteristica_insert_dueno"
ON public.tipo_plaza_caracteristica
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.playa p
    WHERE p.playa_id = tipo_plaza_caracteristica.playa_id
    AND p.playa_dueno_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "tipo_plaza_caracteristica_delete_dueno" ON public.tipo_plaza_caracteristica;
CREATE POLICY "tipo_plaza_caracteristica_delete_dueno"
ON public.tipo_plaza_caracteristica
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.playa p
    WHERE p.playa_id = tipo_plaza_caracteristica.playa_id
    AND p.playa_dueno_id = auth.uid()
  )
);

-- Políticas para modalidad_ocupacion_playa
DROP POLICY IF EXISTS "modalidad_ocupacion_playa_select_dueno" ON public.modalidad_ocupacion_playa;
CREATE POLICY "modalidad_ocupacion_playa_select_dueno"
ON public.modalidad_ocupacion_playa
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.playa p
    WHERE p.playa_id = modalidad_ocupacion_playa.playa_id
    AND p.playa_dueno_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "modalidad_ocupacion_playa_select_playero" ON public.modalidad_ocupacion_playa;
CREATE POLICY "modalidad_ocupacion_playa_select_playero"
ON public.modalidad_ocupacion_playa
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.playero_playa pp
    WHERE pp.playa_id = modalidad_ocupacion_playa.playa_id
    AND pp.playero_id = auth.uid()
    AND pp.estado = 'ACTIVO'
  )
);

DROP POLICY IF EXISTS "modalidad_ocupacion_playa_insert_dueno" ON public.modalidad_ocupacion_playa;
CREATE POLICY "modalidad_ocupacion_playa_insert_dueno"
ON public.modalidad_ocupacion_playa
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.playa p
    WHERE p.playa_id = modalidad_ocupacion_playa.playa_id
    AND p.playa_dueno_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "modalidad_ocupacion_playa_update_dueno" ON public.modalidad_ocupacion_playa;
CREATE POLICY "modalidad_ocupacion_playa_update_dueno"
ON public.modalidad_ocupacion_playa
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.playa p
    WHERE p.playa_id = modalidad_ocupacion_playa.playa_id
    AND p.playa_dueno_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.playa p
    WHERE p.playa_id = modalidad_ocupacion_playa.playa_id
    AND p.playa_dueno_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "modalidad_ocupacion_playa_delete_dueno" ON public.modalidad_ocupacion_playa;
CREATE POLICY "modalidad_ocupacion_playa_delete_dueno"
ON public.modalidad_ocupacion_playa
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.playa p
    WHERE p.playa_id = modalidad_ocupacion_playa.playa_id
    AND p.playa_dueno_id = auth.uid()
  )
);

-- Políticas para metodo_pago_playa
DROP POLICY IF EXISTS "metodo_pago_playa_select_dueno" ON public.metodo_pago_playa;
CREATE POLICY "metodo_pago_playa_select_dueno"
ON public.metodo_pago_playa
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.playa p
    WHERE p.playa_id = metodo_pago_playa.playa_id
    AND p.playa_dueno_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "metodo_pago_playa_select_playero" ON public.metodo_pago_playa;
CREATE POLICY "metodo_pago_playa_select_playero"
ON public.metodo_pago_playa
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.playero_playa pp
    WHERE pp.playa_id = metodo_pago_playa.playa_id
    AND pp.playero_id = auth.uid()
    AND pp.estado = 'ACTIVO'
  )
);

DROP POLICY IF EXISTS "metodo_pago_playa_insert_dueno" ON public.metodo_pago_playa;
CREATE POLICY "metodo_pago_playa_insert_dueno"
ON public.metodo_pago_playa
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.playa p
    WHERE p.playa_id = metodo_pago_playa.playa_id
    AND p.playa_dueno_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "metodo_pago_playa_update_dueno" ON public.metodo_pago_playa;
CREATE POLICY "metodo_pago_playa_update_dueno"
ON public.metodo_pago_playa
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.playa p
    WHERE p.playa_id = metodo_pago_playa.playa_id
    AND p.playa_dueno_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.playa p
    WHERE p.playa_id = metodo_pago_playa.playa_id
    AND p.playa_dueno_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "metodo_pago_playa_delete_dueno" ON public.metodo_pago_playa;
CREATE POLICY "metodo_pago_playa_delete_dueno"
ON public.metodo_pago_playa
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.playa p
    WHERE p.playa_id = metodo_pago_playa.playa_id
    AND p.playa_dueno_id = auth.uid()
  )
);

-- Políticas para tipo_vehiculo_playa
DROP POLICY IF EXISTS "tipo_vehiculo_playa_select_dueno" ON public.tipo_vehiculo_playa;
CREATE POLICY "tipo_vehiculo_playa_select_dueno"
ON public.tipo_vehiculo_playa
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.playa p
    WHERE p.playa_id = tipo_vehiculo_playa.playa_id
    AND p.playa_dueno_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "tipo_vehiculo_playa_select_playero" ON public.tipo_vehiculo_playa;
CREATE POLICY "tipo_vehiculo_playa_select_playero"
ON public.tipo_vehiculo_playa
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.playero_playa pp
    WHERE pp.playa_id = tipo_vehiculo_playa.playa_id
    AND pp.playero_id = auth.uid()
    AND pp.estado = 'ACTIVO'
  )
);

DROP POLICY IF EXISTS "tipo_vehiculo_playa_insert_dueno" ON public.tipo_vehiculo_playa;
CREATE POLICY "tipo_vehiculo_playa_insert_dueno"
ON public.tipo_vehiculo_playa
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.playa p
    WHERE p.playa_id = tipo_vehiculo_playa.playa_id
    AND p.playa_dueno_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "tipo_vehiculo_playa_update_dueno" ON public.tipo_vehiculo_playa;
CREATE POLICY "tipo_vehiculo_playa_update_dueno"
ON public.tipo_vehiculo_playa
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.playa p
    WHERE p.playa_id = tipo_vehiculo_playa.playa_id
    AND p.playa_dueno_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.playa p
    WHERE p.playa_id = tipo_vehiculo_playa.playa_id
    AND p.playa_dueno_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "tipo_vehiculo_playa_delete_dueno" ON public.tipo_vehiculo_playa;
CREATE POLICY "tipo_vehiculo_playa_delete_dueno"
ON public.tipo_vehiculo_playa
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.playa p
    WHERE p.playa_id = tipo_vehiculo_playa.playa_id
    AND p.playa_dueno_id = auth.uid()
  )
);

-- Políticas para tarifa
DROP POLICY IF EXISTS "tarifa_select_dueno" ON public.tarifa;
CREATE POLICY "tarifa_select_dueno"
ON public.tarifa
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.playa p
    WHERE p.playa_id = tarifa.playa_id
    AND p.playa_dueno_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "tarifa_select_playero" ON public.tarifa;
CREATE POLICY "tarifa_select_playero"
ON public.tarifa
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.playero_playa pp
    WHERE pp.playa_id = tarifa.playa_id
    AND pp.playero_id = auth.uid()
    AND pp.estado = 'ACTIVO'
  )
);

DROP POLICY IF EXISTS "tarifa_insert_dueno" ON public.tarifa;
CREATE POLICY "tarifa_insert_dueno"
ON public.tarifa
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.playa p
    WHERE p.playa_id = tarifa.playa_id
    AND p.playa_dueno_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "tarifa_update_dueno" ON public.tarifa;
CREATE POLICY "tarifa_update_dueno"
ON public.tarifa
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.playa p
    WHERE p.playa_id = tarifa.playa_id
    AND p.playa_dueno_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.playa p
    WHERE p.playa_id = tarifa.playa_id
    AND p.playa_dueno_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "tarifa_delete_dueno" ON public.tarifa;
CREATE POLICY "tarifa_delete_dueno"
ON public.tarifa
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.playa p
    WHERE p.playa_id = tarifa.playa_id
    AND p.playa_dueno_id = auth.uid()
  )
);

-- =====================================================
-- 4. ACTUALIZAR FUNCIÓN get_authenticated_user_with_roles
-- =====================================================

-- La función debe usar la nueva vista que no expone auth.users
DROP FUNCTION IF EXISTS public.get_authenticated_user_with_roles() CASCADE;

CREATE OR REPLACE FUNCTION public.get_authenticated_user_with_roles()
RETURNS TABLE (
  usuario_id uuid,
  email text,
  nombre text,
  telefono text,
  roles public.rol[]
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
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

COMMENT ON FUNCTION public.get_authenticated_user_with_roles() IS 'Función optimizada que retorna el usuario autenticado con sus roles en una sola query. Usa la vista v_user_with_roles que NO expone auth.users directamente.';

