CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_turno_per_playero 
ON turno (playero_id) 
WHERE fecha_hora_salida IS NULL;

