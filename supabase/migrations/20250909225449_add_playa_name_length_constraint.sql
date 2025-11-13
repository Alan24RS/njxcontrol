-- =====================================================
-- MIGRACIÓN: AGREGAR CONSTRAINT DE LONGITUD AL NOMBRE DE PLAYA
-- =====================================================

-- Agrega un constraint para limitar el nombre de la playa a máximo 35 caracteres

-- Primero, truncar nombres existentes que excedan los 35 caracteres
UPDATE playa 
SET nombre = LEFT(nombre, 35)
WHERE nombre IS NOT NULL AND char_length(nombre) > 35;

-- Agregar constraint de longitud máxima para el nombre de la playa
ALTER TABLE playa 
ADD CONSTRAINT playa_nombre_length_check 
CHECK (nombre IS NULL OR char_length(nombre) <= 35);

-- Comentario para documentar el constraint
-- Comentario para documentar el constraint
COMMENT ON CONSTRAINT playa_nombre_length_check ON playa IS 
'Limita el nombre de la playa a máximo 35 caracteres';
