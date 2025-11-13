-- =====================================================
-- MIGRACIÓN: CORREGIR FUNCIÓN DE VALIDACIÓN DE ROLES
-- =====================================================
-- Corrige el tipo de datos en la función de validación de roles

-- Corregir función de validación para aceptar UUID en lugar de INTEGER
CREATE OR REPLACE FUNCTION _assert_usuario_tiene_rol(p_usuario_id uuid, p_rol rol)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.rol_usuario
     WHERE usuario_id = p_usuario_id AND rol = p_rol
  ) THEN
    RAISE EXCEPTION 'El usuario % no posee el rol requerido: %', p_usuario_id, p_rol
      USING ERRCODE = '23514';
  END IF;
END;
$$;

-- Corregir función de trigger para usar UUID correctamente
CREATE OR REPLACE FUNCTION trg_playa_dueno_must_be_dueno()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM public._assert_usuario_tiene_rol(NEW.playa_dueno_id, 'DUENO');
  RETURN NEW;
END;
$$;

-- Corregir función de trigger para playeros (preparada para futuras tablas)
CREATE OR REPLACE FUNCTION trg_playeroplaya_user_must_be_playero()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM public._assert_usuario_tiene_rol(NEW.playero_id, 'PLAYERO');
  RETURN NEW;
END;
$$;

-- Corregir función de trigger para turnos (preparada para futuras tablas)
CREATE OR REPLACE FUNCTION trg_turno_user_must_be_playero_activo()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_activo BOOLEAN;
BEGIN
  PERFORM public._assert_usuario_tiene_rol(NEW.usuario_id, 'PLAYERO');

  -- Esta validación se activará cuando exista la tabla Playero_Playa
  /*
  SELECT (pp.estado = 'ACTIVO')
    INTO v_activo
    FROM public."Playero_Playa" pp
   WHERE pp.playa_id = NEW.playa_id
     AND pp.playero_id = NEW.usuario_id;

  IF v_activo IS DISTINCT FROM TRUE THEN
    RAISE EXCEPTION 'El usuario % no tiene acceso ACTIVO a la playa %',
      NEW.usuario_id, NEW.playa_id
      USING ERRCODE = '23514';
  END IF;
  */

  RETURN NEW;
END;
$$;
