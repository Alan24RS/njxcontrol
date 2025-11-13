-- =====================================================
-- MIGRACIÓN: TABLAS DE CONFIGURACIÓN DE PLAYAS
-- =====================================================
-- Crea las tablas para configurar métodos de pago, modalidades de ocupación, tipos de vehículo y tarifas

-- Tabla de modalidades de ocupación por playa
CREATE TABLE IF NOT EXISTS modalidad_ocupacion_playa (
    playa_id uuid NOT NULL,
    modalidad_ocupacion modalidad_ocupacion NOT NULL,
    estado modalidad_ocupacion_playa_estado NOT NULL DEFAULT 'ACTIVO'::modalidad_ocupacion_playa_estado,
    fecha_creacion timestamp with time zone NOT NULL DEFAULT now(),
    fecha_modificacion timestamp with time zone NOT NULL DEFAULT now(),
    fecha_eliminacion timestamp with time zone,
    CONSTRAINT modalidad_ocupacion_playa_pkey PRIMARY KEY (playa_id, modalidad_ocupacion),
    CONSTRAINT modalidad_ocupacion_playa_playa_id_fkey FOREIGN KEY (playa_id) REFERENCES playa(playa_id) ON DELETE CASCADE
);

-- Tabla de métodos de pago por playa
CREATE TABLE IF NOT EXISTS metodo_pago_playa (
    playa_id uuid NOT NULL,
    metodo_pago metodo_pago NOT NULL,
    estado metodo_pago_estado NOT NULL DEFAULT 'ACTIVO'::metodo_pago_estado,
    fecha_creacion timestamp with time zone NOT NULL DEFAULT now(),
    fecha_modificacion timestamp with time zone NOT NULL DEFAULT now(),
    fecha_eliminacion timestamp with time zone,
    CONSTRAINT metodo_pago_playa_pkey PRIMARY KEY (playa_id, metodo_pago),
    CONSTRAINT metodo_pago_playa_playa_id_fkey FOREIGN KEY (playa_id) REFERENCES playa(playa_id) ON DELETE CASCADE
);

-- Tabla de tipos de vehículo habilitados por playa
CREATE TABLE IF NOT EXISTS tipo_vehiculo_playa (
    playa_id uuid NOT NULL,
    tipo_vehiculo tipo_vehiculo NOT NULL,
    estado tipo_vehiculo_estado NOT NULL DEFAULT 'ACTIVO'::tipo_vehiculo_estado,
    fecha_creacion timestamp with time zone NOT NULL DEFAULT now(),
    fecha_modificacion timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT tipo_vehiculo_playa_pkey PRIMARY KEY (playa_id, tipo_vehiculo),
    CONSTRAINT tipo_vehiculo_playa_playa_id_fkey FOREIGN KEY (playa_id) REFERENCES playa(playa_id) ON DELETE CASCADE
);

-- Tabla de tarifas
CREATE TABLE IF NOT EXISTS tarifa (
    playa_id uuid NOT NULL,
    tipo_plaza_id bigint NOT NULL,
    modalidad_ocupacion modalidad_ocupacion NOT NULL,
    tipo_vehiculo tipo_vehiculo NOT NULL,
    precio_base real NOT NULL,
    fecha_creacion timestamp with time zone NOT NULL DEFAULT now(),
    fecha_modificacion timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT tarifa_pkey PRIMARY KEY (playa_id, tipo_plaza_id, modalidad_ocupacion, tipo_vehiculo),
    CONSTRAINT tarifa_playa_id_fkey FOREIGN KEY (playa_id) REFERENCES playa(playa_id) ON DELETE CASCADE,
    CONSTRAINT tarifa_tipo_plaza_fkey FOREIGN KEY (tipo_plaza_id, playa_id) REFERENCES tipo_plaza(tipo_plaza_id, playa_id) ON DELETE CASCADE
);
