-- =====================================================
-- MIGRACIÓN: TIPOS ENUM
-- =====================================================
-- Crea todos los tipos enumerados utilizados en el sistema

-- Tipos relacionados con métodos de pago
DO $$ BEGIN
    CREATE TYPE metodo_pago AS ENUM ('EFECTIVO', 'TRANSFERENCIA', 'MERCADO_PAGO');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE metodo_pago_estado AS ENUM ('ACTIVO', 'SUSPENDIDO');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Tipos relacionados con modalidades de ocupación
DO $$ BEGIN
    CREATE TYPE modalidad_ocupacion AS ENUM ('POR_HORA', 'DIARIA', 'SEMANAL', 'MENSUAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE modalidad_ocupacion_playa_estado AS ENUM ('ACTIVO', 'SUSPENDIDO');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Tipos relacionados con estados de entidades principales
DO $$ BEGIN
    CREATE TYPE playa_estado AS ENUM ('BORRADOR', 'ACTIVO', 'SUSPENDIDO');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE plaza_estado AS ENUM ('ACTIVO', 'SUSPENDIDO');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE playero_playa_estado AS ENUM ('ACTIVO', 'SUSPENDIDO');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Tipos relacionados con roles de usuario
DO $$ BEGIN
    CREATE TYPE rol AS ENUM ('DUENO', 'PLAYERO');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Tipos relacionados con vehículos
DO $$ BEGIN
    CREATE TYPE tipo_vehiculo AS ENUM ('AUTOMOVIL', 'MOTOCICLETA', 'CAMIONETA');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE tipo_vehiculo_estado AS ENUM ('ACTIVO', 'SUSPENDIDO');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

--Tipos de estado de ocupacion 

CREATE TYPE public.estado_ocupacion AS ENUM ('ACTIVA', 'CERRADA', 'CANCELADA');