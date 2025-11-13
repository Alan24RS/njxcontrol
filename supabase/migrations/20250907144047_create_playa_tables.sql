-- =====================================================
-- MIGRACIÓN: TABLAS DE PLAYAS
-- =====================================================
-- Crea las tablas relacionadas con playas y sus configuraciones

-- Tabla principal de playas
CREATE TABLE IF NOT EXISTS playa (
    playa_id uuid NOT NULL DEFAULT gen_random_uuid(),
    playa_dueno_id uuid NOT NULL,
    nombre text,
    descripcion text,
    direccion text NOT NULL,
    ciudad_id uuid NOT NULL,
    latitud double precision NOT NULL,
    longitud double precision NOT NULL,
    horario text,
    estado playa_estado NOT NULL DEFAULT 'BORRADOR'::playa_estado,
    fecha_creacion timestamp with time zone NOT NULL DEFAULT now(),
    fecha_modificacion timestamp with time zone NOT NULL DEFAULT now(),
    fecha_eliminacion timestamp with time zone,
    CONSTRAINT playa_pkey PRIMARY KEY (playa_id),
    CONSTRAINT playa_playa_dueno_id_fkey FOREIGN KEY (playa_dueno_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT playa_ciudad_id_fkey FOREIGN KEY (ciudad_id) REFERENCES ciudad(ciudad_id) ON DELETE RESTRICT
);

-- Tabla de tipos de plaza
CREATE TABLE IF NOT EXISTS tipo_plaza (
    tipo_plaza_id bigint NOT NULL DEFAULT nextval('tipo_plaza_tipo_plaza_id_seq'::regclass),
    playa_id uuid NOT NULL,
    nombre text NOT NULL,
    descripcion text DEFAULT ''::text,
    fecha_creacion timestamp with time zone NOT NULL DEFAULT now(),
    fecha_modificacion timestamp with time zone NOT NULL DEFAULT now(),
    fecha_eliminacion timestamp with time zone,
    CONSTRAINT tipo_plaza_pkey PRIMARY KEY (tipo_plaza_id, playa_id),
    CONSTRAINT tipo_plaza_playa_id_fkey FOREIGN KEY (playa_id) REFERENCES playa(playa_id) ON DELETE CASCADE
);

-- Tabla de relación entre tipos de plaza y características
CREATE TABLE IF NOT EXISTS tipo_plaza_caracteristica (
    playa_id uuid NOT NULL,
    tipo_plaza_id bigint NOT NULL,
    caracteristica_id bigint NOT NULL,
    fecha_creacion timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT tipo_plaza_caracteristica_pkey PRIMARY KEY (playa_id, tipo_plaza_id, caracteristica_id),
    CONSTRAINT tipo_plaza_caracteristica_tipo_plaza_fkey FOREIGN KEY (tipo_plaza_id, playa_id) REFERENCES tipo_plaza(tipo_plaza_id, playa_id) ON DELETE CASCADE,
    CONSTRAINT tipo_plaza_caracteristica_caracteristica_id_fkey FOREIGN KEY (caracteristica_id) REFERENCES caracteristica(caracteristica_id) ON DELETE CASCADE
);

-- Tabla de plazas individuales
CREATE TABLE IF NOT EXISTS plaza (
    plaza_id uuid NOT NULL DEFAULT gen_random_uuid(),
    playa_id uuid NOT NULL,
    tipo_plaza_id bigint NOT NULL,
    identificador text,
    estado plaza_estado NOT NULL DEFAULT 'ACTIVO'::plaza_estado,
    fecha_creacion timestamp with time zone NOT NULL DEFAULT now(),
    fecha_modificacion timestamp with time zone DEFAULT now(),
    fecha_eliminacion timestamp with time zone,
    CONSTRAINT plaza_pkey PRIMARY KEY (plaza_id),
    CONSTRAINT plaza_identificador_key UNIQUE (identificador),
    CONSTRAINT plaza_playa_id_fkey FOREIGN KEY (playa_id) REFERENCES playa(playa_id) ON DELETE CASCADE,
    CONSTRAINT plaza_tipo_plaza_fkey FOREIGN KEY (tipo_plaza_id, playa_id) REFERENCES tipo_plaza(tipo_plaza_id, playa_id) ON DELETE CASCADE
);

-- Asignar propietario de secuencia (solo si no está ya asignada)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_depend 
        WHERE objid = 'tipo_plaza_tipo_plaza_id_seq'::regclass 
        AND refobjid = 'tipo_plaza'::regclass
    ) THEN
        ALTER SEQUENCE tipo_plaza_tipo_plaza_id_seq OWNED BY tipo_plaza.tipo_plaza_id;
    END IF;
END $$;
