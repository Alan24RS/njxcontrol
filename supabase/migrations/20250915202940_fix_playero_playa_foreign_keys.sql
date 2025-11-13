-- =====================================================
-- MIGRACIÓN: CORREGIR FOREIGN KEYS DE PLAYERO_PLAYA
-- =====================================================
-- Corrige las referencias para que apunten a public.usuario en lugar de auth.users

-- Eliminar constraints existentes
ALTER TABLE playero_playa DROP CONSTRAINT IF EXISTS playero_playa_playero_id_fkey;
ALTER TABLE playero_playa DROP CONSTRAINT IF EXISTS playero_playa_dueno_invitador_id_fkey;

-- Agregar nuevos constraints que referencian a public.usuario
ALTER TABLE playero_playa 
ADD CONSTRAINT playero_playa_playero_id_fkey 
FOREIGN KEY (playero_id) REFERENCES usuario(usuario_id) ON DELETE CASCADE;

ALTER TABLE playero_playa 
ADD CONSTRAINT playero_playa_dueno_invitador_id_fkey 
FOREIGN KEY (dueno_invitador_id) REFERENCES usuario(usuario_id) ON DELETE RESTRICT;

-- Actualizar comentarios para reflejar el cambio
COMMENT ON COLUMN playero_playa.playero_id IS 'ID del usuario (public.usuario) con rol PLAYERO';
COMMENT ON COLUMN playero_playa.dueno_invitador_id IS 'ID del usuario (public.usuario) con rol DUENO que invitó al playero';
