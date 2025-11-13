-- =====================================================
-- MIGRACIÓN: TABLAS PRINCIPALES
-- =====================================================
-- Crea las tablas principales del sistema: usuarios, ciudades, características

-- Tabla de usuarios (espejo de auth.users)
CREATE TABLE IF NOT EXISTS usuario (
    usuario_id uuid NOT NULL DEFAULT gen_random_uuid(),
    email text NOT NULL,
    nombre text NOT NULL,
    telefono text,
    fecha_creacion timestamp with time zone NOT NULL DEFAULT now(),
    fecha_modificacion timestamp with time zone NOT NULL DEFAULT now(),
    fecha_eliminacion timestamp with time zone,
    CONSTRAINT usuario_pkey PRIMARY KEY (usuario_id),
    CONSTRAINT usuario_email_key UNIQUE (email)
);

-- Tabla de roles de usuario
CREATE TABLE IF NOT EXISTS rol_usuario (
    usuario_id uuid NOT NULL,
    rol rol NOT NULL,
    CONSTRAINT rol_usuario_pkey PRIMARY KEY (usuario_id, rol),
    CONSTRAINT rol_usuario_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Tabla de ciudades
CREATE TABLE IF NOT EXISTS ciudad (
    ciudad_id uuid NOT NULL DEFAULT gen_random_uuid(),
    nombre text NOT NULL,
    provincia text NOT NULL,
    fecha_creacion timestamp with time zone DEFAULT now(),
    fecha_modificacion timestamp with time zone DEFAULT now(),
    CONSTRAINT ciudad_pkey PRIMARY KEY (ciudad_id),
    CONSTRAINT ciudad_nombre_provincia_key UNIQUE (nombre, provincia)
);

-- Tabla de características para tipos de plaza
CREATE TABLE IF NOT EXISTS caracteristica (
    caracteristica_id bigint NOT NULL DEFAULT nextval('caracteristica_caracteristica_id_seq'::regclass),
    nombre text NOT NULL,
    fecha_creacion timestamp with time zone NOT NULL DEFAULT now(),
    fecha_modificacion timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT caracteristica_pkey PRIMARY KEY (caracteristica_id),
    CONSTRAINT caracteristica_nombre_key UNIQUE (nombre)
);

-- Asignar propietarios de secuencias (solo si no están ya asignadas)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_depend 
        WHERE objid = 'caracteristica_caracteristica_id_seq'::regclass 
        AND refobjid = 'caracteristica'::regclass
    ) THEN
        ALTER SEQUENCE caracteristica_caracteristica_id_seq OWNED BY caracteristica.caracteristica_id;
    END IF;
END $$;
