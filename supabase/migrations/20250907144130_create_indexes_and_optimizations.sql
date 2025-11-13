-- =====================================================
-- MIGRACIÓN: ÍNDICES Y OPTIMIZACIONES
-- =====================================================
-- Crea índices para mejorar el rendimiento de consultas frecuentes

-- Índices para la tabla playa
CREATE INDEX IF NOT EXISTS idx_playa_ciudad_id ON playa USING btree (ciudad_id);
CREATE INDEX IF NOT EXISTS idx_playa_direccion ON playa USING btree (direccion);
CREATE INDEX IF NOT EXISTS idx_playa_nombre ON playa USING btree (nombre);

-- Índices únicos para evitar duplicados por usuario
CREATE UNIQUE INDEX IF NOT EXISTS unique_playa_address_per_user 
    ON playa USING btree (playa_dueno_id, direccion, ciudad_id);
CREATE UNIQUE INDEX IF NOT EXISTS unique_playa_coordinates_per_user 
    ON playa USING btree (playa_dueno_id, latitud, longitud);
