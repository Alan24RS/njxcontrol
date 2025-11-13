-- =====================================================
-- MIGRACIÓN: APLICAR TRIGGERS
-- =====================================================
-- Aplica triggers a las tablas para automatización y validación

-- Trigger para manejar nuevos usuarios de auth
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
        CREATE TRIGGER on_auth_user_created
          AFTER INSERT ON auth.users
          FOR EACH ROW EXECUTE FUNCTION handle_new_user();
    END IF;
END $$;

-- Trigger para validar que el dueño de playa tenga rol DUENO
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_playa_dueno_must_be_dueno') THEN
        CREATE TRIGGER trigger_playa_dueno_must_be_dueno
          BEFORE INSERT OR UPDATE ON playa
          FOR EACH ROW EXECUTE FUNCTION trg_playa_dueno_must_be_dueno();
    END IF;
END $$;

-- Triggers para actualizar fecha_modificacion automáticamente
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_set_fecha_modificacion_caracteristica') THEN
        CREATE TRIGGER trigger_set_fecha_modificacion_caracteristica
            BEFORE UPDATE ON caracteristica
            FOR EACH ROW EXECUTE FUNCTION set_fecha_modificacion();
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_set_fecha_modificacion_ciudad') THEN
        CREATE TRIGGER trigger_set_fecha_modificacion_ciudad
            BEFORE UPDATE ON ciudad
            FOR EACH ROW EXECUTE FUNCTION set_fecha_modificacion();
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_set_fecha_modificacion_usuario') THEN
        CREATE TRIGGER trigger_set_fecha_modificacion_usuario
            BEFORE UPDATE ON usuario
            FOR EACH ROW EXECUTE FUNCTION set_fecha_modificacion();
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_set_fecha_modificacion_playa') THEN
        CREATE TRIGGER trigger_set_fecha_modificacion_playa
            BEFORE UPDATE ON playa
            FOR EACH ROW EXECUTE FUNCTION set_fecha_modificacion();
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_set_fecha_modificacion_tipo_plaza') THEN
        CREATE TRIGGER trigger_set_fecha_modificacion_tipo_plaza
            BEFORE UPDATE ON tipo_plaza
            FOR EACH ROW EXECUTE FUNCTION set_fecha_modificacion();
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_set_fecha_modificacion_plaza') THEN
        CREATE TRIGGER trigger_set_fecha_modificacion_plaza
            BEFORE UPDATE ON plaza
            FOR EACH ROW EXECUTE FUNCTION set_fecha_modificacion();
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_set_fecha_modificacion_modalidad_ocupacion_playa') THEN
        CREATE TRIGGER trigger_set_fecha_modificacion_modalidad_ocupacion_playa
            BEFORE UPDATE ON modalidad_ocupacion_playa
            FOR EACH ROW EXECUTE FUNCTION set_fecha_modificacion();
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_set_fecha_modificacion_metodo_pago_playa') THEN
        CREATE TRIGGER trigger_set_fecha_modificacion_metodo_pago_playa
            BEFORE UPDATE ON metodo_pago_playa
            FOR EACH ROW EXECUTE FUNCTION set_fecha_modificacion();
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_set_fecha_modificacion_tipo_vehiculo_playa') THEN
        CREATE TRIGGER trigger_set_fecha_modificacion_tipo_vehiculo_playa
            BEFORE UPDATE ON tipo_vehiculo_playa
            FOR EACH ROW EXECUTE FUNCTION set_fecha_modificacion();
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_set_fecha_modificacion_tarifa') THEN
        CREATE TRIGGER trigger_set_fecha_modificacion_tarifa
            BEFORE UPDATE ON tarifa
            FOR EACH ROW EXECUTE FUNCTION set_fecha_modificacion();
    END IF;
END $$;
