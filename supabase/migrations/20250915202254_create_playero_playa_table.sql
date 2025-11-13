-- =====================================================
-- MIGRACIÓN: TABLA PLAYERO_PLAYA
-- =====================================================
-- Crea la tabla para la relación entre playeros y playas con PK compuesta

-- Tabla de relación playero-playa
CREATE TABLE IF NOT EXISTS playero_playa (
    playero_id uuid NOT NULL,
    playa_id uuid NOT NULL,
    dueno_invitador_id uuid NOT NULL,
    estado playero_playa_estado NOT NULL DEFAULT 'ACTIVO'::playero_playa_estado,
    fecha_alta timestamp with time zone NOT NULL DEFAULT now(),
    fecha_baja timestamp with time zone,
    motivo_baja text,
    fecha_creacion timestamp with time zone NOT NULL DEFAULT now(),
    fecha_modificacion timestamp with time zone NOT NULL DEFAULT now(),
    
    CONSTRAINT playero_playa_pkey PRIMARY KEY (playero_id, playa_id),
    CONSTRAINT playero_playa_playero_id_fkey FOREIGN KEY (playero_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT playero_playa_playa_id_fkey FOREIGN KEY (playa_id) REFERENCES playa(playa_id) ON DELETE CASCADE,
    CONSTRAINT playero_playa_dueno_invitador_id_fkey FOREIGN KEY (dueno_invitador_id) REFERENCES auth.users(id) ON DELETE RESTRICT
);

-- Trigger para validar que el playero tenga rol PLAYERO
CREATE TRIGGER trg_playero_playa_validate_playero
    BEFORE INSERT OR UPDATE ON playero_playa
    FOR EACH ROW
    EXECUTE FUNCTION trg_playeroplaya_user_must_be_playero();

-- Trigger para validar que el dueño invitador tenga rol DUENO
CREATE OR REPLACE FUNCTION trg_playero_playa_validate_dueno_invitador()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM public._assert_usuario_tiene_rol(NEW.dueno_invitador_id, 'DUENO');
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_playero_playa_validate_dueno_invitador
    BEFORE INSERT OR UPDATE ON playero_playa
    FOR EACH ROW
    EXECUTE FUNCTION trg_playero_playa_validate_dueno_invitador();

-- Trigger para validar que el dueño invitador tenga acceso a la playa
CREATE OR REPLACE FUNCTION trg_playero_playa_validate_dueno_access()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM playa 
    WHERE playa_id = NEW.playa_id 
    AND playa_dueno_id = NEW.dueno_invitador_id
  ) THEN
    RAISE EXCEPTION 'El dueño invitador % no tiene acceso a la playa %', 
      NEW.dueno_invitador_id, NEW.playa_id
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_playero_playa_validate_dueno_access
    BEFORE INSERT OR UPDATE ON playero_playa
    FOR EACH ROW
    EXECUTE FUNCTION trg_playero_playa_validate_dueno_access();

-- Función para actualizar fecha_modificacion automáticamente
CREATE OR REPLACE FUNCTION trg_update_fecha_modificacion_playero_playa()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.fecha_modificacion = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_fecha_modificacion_playero_playa
    BEFORE UPDATE ON playero_playa
    FOR EACH ROW
    EXECUTE FUNCTION trg_update_fecha_modificacion_playero_playa();

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_playero_playa_playero_id ON playero_playa(playero_id);
CREATE INDEX IF NOT EXISTS idx_playero_playa_playa_id ON playero_playa(playa_id);
CREATE INDEX IF NOT EXISTS idx_playero_playa_dueno_invitador_id ON playero_playa(dueno_invitador_id);
CREATE INDEX IF NOT EXISTS idx_playero_playa_estado ON playero_playa(estado);
CREATE INDEX IF NOT EXISTS idx_playero_playa_fecha_alta ON playero_playa(fecha_alta);
CREATE INDEX IF NOT EXISTS idx_playero_playa_fecha_baja ON playero_playa(fecha_baja);

-- Comentarios para documentación
COMMENT ON TABLE playero_playa IS 'Relación entre playeros y playas. Un playero puede trabajar en múltiples playas y una playa puede tener múltiples playeros.';
COMMENT ON COLUMN playero_playa.playero_id IS 'ID del usuario con rol PLAYERO';
COMMENT ON COLUMN playero_playa.playa_id IS 'ID de la playa donde trabaja el playero';
COMMENT ON COLUMN playero_playa.dueno_invitador_id IS 'ID del dueño que invitó al playero a trabajar en esta playa';
COMMENT ON COLUMN playero_playa.estado IS 'Estado actual de la relación: ACTIVO o SUSPENDIDO';
COMMENT ON COLUMN playero_playa.fecha_alta IS 'Fecha cuando el playero se dio de alta en la playa';
COMMENT ON COLUMN playero_playa.fecha_baja IS 'Fecha cuando el playero se dio de baja de la playa (solo si estado=SUSPENDIDO)';
COMMENT ON COLUMN playero_playa.motivo_baja IS 'Motivo por el cual el playero se dio de baja de la playa';
