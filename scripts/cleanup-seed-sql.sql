-- Script SQL para eliminar datos de seed con FKs circulares
-- Ejecutar en Supabase SQL Editor

BEGIN;

-- Diferir todas las constraints FK hasta el COMMIT
SET CONSTRAINTS ALL DEFERRED;

-- 1. Eliminar pagos de ocupaciones seed (patentes AAA*, BBA*, BBM*)
DELETE FROM pago 
WHERE ocupacion_id IN (
  SELECT ocupacion_id 
  FROM ocupacion 
  WHERE patente LIKE 'AAA%' 
     OR patente LIKE 'BBA%' 
     OR patente LIKE 'BBM%'
);

-- 2. Eliminar pagos de boletas de abonados seed
DELETE FROM pago 
WHERE boleta_id IN (
  SELECT b.boleta_id
  FROM boleta b
  JOIN abono ab ON b.playa_id = ab.playa_id 
    AND b.plaza_id = ab.plaza_id 
    AND b.fecha_hora_inicio_abono = ab.fecha_hora_inicio
  JOIN abonado a ON ab.abonado_id = a.abonado_id
  WHERE a.email ILIKE 'abonado%@test.com'
);

-- 3. Eliminar ocupaciones seed
DELETE FROM ocupacion 
WHERE patente LIKE 'AAA%' 
   OR patente LIKE 'BBA%' 
   OR patente LIKE 'BBM%';

-- 4. Eliminar boletas de abonados seed
DELETE FROM boleta 
WHERE (playa_id, plaza_id, fecha_hora_inicio_abono) IN (
  SELECT ab.playa_id, ab.plaza_id, ab.fecha_hora_inicio 
  FROM abono ab
  JOIN abonado a ON ab.abonado_id = a.abonado_id
  WHERE a.email ILIKE 'abonado%@test.com'
);

-- 5. Eliminar abono_vehiculo de abonados seed
DELETE FROM abono_vehiculo 
WHERE (playa_id, plaza_id, fecha_hora_inicio) IN (
  SELECT ab.playa_id, ab.plaza_id, ab.fecha_hora_inicio 
  FROM abono ab
  JOIN abonado a ON ab.abonado_id = a.abonado_id
  WHERE a.email ILIKE 'abonado%@test.com'
);

-- 6. Eliminar abonos de abonados seed
DELETE FROM abono 
WHERE abonado_id IN (
  SELECT abonado_id 
  FROM abonado 
  WHERE email ILIKE 'abonado%@test.com'
);

-- 7. Eliminar abonados seed
DELETE FROM abonado 
WHERE email ILIKE 'abonado%@test.com';

-- 8. Eliminar vehículos huérfanos de seed
DELETE FROM vehiculo 
WHERE patente LIKE 'AAA%' 
   OR patente LIKE 'BBA%' 
   OR patente LIKE 'BBM%';

COMMIT;

-- Verificar limpieza
SELECT 
  (SELECT COUNT(*) FROM ocupacion WHERE patente LIKE 'AAA%' OR patente LIKE 'BBA%' OR patente LIKE 'BBM%') as ocupaciones_restantes,
  (SELECT COUNT(*) FROM abonado WHERE email ILIKE 'abonado%@test.com') as abonados_restantes,
  (SELECT COUNT(*) FROM vehiculo WHERE patente LIKE 'AAA%' OR patente LIKE 'BBA%' OR patente LIKE 'BBM%') as vehiculos_restantes;
