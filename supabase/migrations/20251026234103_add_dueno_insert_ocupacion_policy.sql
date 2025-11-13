-- Migration: Permitir a dueños crear ocupaciones en sus playas
-- Fecha: 2025-10-19
-- Descripción: Agrega policy RLS para que los dueños puedan insertar ocupaciones
--              en las playas que les pertenecen, sin necesidad de turno activo.

-- Verificar políticas existentes para ocupacion
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'ocupacion'
ORDER BY cmd, policyname;

-- Crear policy para que dueños puedan crear ocupaciones
-- Restricciones de seguridad:
-- 1. Solo usuarios autenticados (TO authenticated)
-- 2. La playa debe pertenecer al dueño (playa_dueno_id = auth.uid())
-- 3. La plaza debe pertenecer a la playa especificada (relación plaza-playa válida)
CREATE POLICY "Dueños pueden crear ocupaciones en sus playas"
ON public.ocupacion
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM playa p
    WHERE p.playa_id = ocupacion.playa_id
    AND p.playa_dueno_id = auth.uid()
  )
  AND EXISTS (
    SELECT 1
    FROM plaza pl
    WHERE pl.plaza_id = ocupacion.plaza_id
    AND pl.playa_id = ocupacion.playa_id
  )
);

-- Comentario explicativo
COMMENT ON POLICY "Dueños pueden crear ocupaciones en sus playas" ON public.ocupacion IS 
'Permite a los dueños crear ocupaciones en las playas que les pertenecen. 
Validaciones: 
- Solo usuarios autenticados
- La playa debe pertenecer al dueño
- La plaza debe pertenecer a la playa especificada
A diferencia de los playeros, los dueños no necesitan tener un turno activo para registrar ocupaciones.';
