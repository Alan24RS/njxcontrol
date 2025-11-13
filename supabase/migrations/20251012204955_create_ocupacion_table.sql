-- ============================================================================
-- Tabla: ocupacion
-- Descripción: Registra los ingresos y egresos de vehículos en las plazas
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.ocupacion (
    ocupacion_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    playa_id UUID NOT NULL,
    plaza_id UUID NOT NULL,
    playero_id UUID NOT NULL,
    patente VARCHAR(7) NOT NULL,
    tipo_vehiculo VARCHAR(20) NOT NULL,
    hora_ingreso TIMESTAMPTZ NOT NULL DEFAULT now(),
    hora_egreso TIMESTAMPTZ,
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT now(),
    fecha_modificacion TIMESTAMPTZ,
    
    -- Foreign Keys
    CONSTRAINT ocupacion_playa_id_fkey 
        FOREIGN KEY (playa_id) 
        REFERENCES public.playa(playa_id) 
        ON DELETE CASCADE,
    
    CONSTRAINT ocupacion_plaza_id_fkey 
        FOREIGN KEY (plaza_id) 
        REFERENCES public.plaza(plaza_id) 
        ON DELETE CASCADE,
    
    CONSTRAINT ocupacion_playero_id_fkey 
        FOREIGN KEY (playero_id) 
        REFERENCES auth.users(id) 
        ON DELETE CASCADE,
    
    -- Constraints
    CONSTRAINT chk_patente_formato CHECK (
        patente ~ '^(?:[A-Z]{3}[0-9]{3}|[A-Z]{2}[0-9]{3}[A-Z]{2})$'
    ),
    
    CONSTRAINT chk_hora_egreso_posterior CHECK (
        hora_egreso IS NULL OR hora_egreso > hora_ingreso
    ),
    
    CONSTRAINT chk_tipo_vehiculo_valido CHECK (
        tipo_vehiculo IN ('AUTOMOVIL', 'MOTOCICLETA', 'CAMIONETA')
    )
);

-- ============================================================================
-- Índices
-- ============================================================================

-- Índice único parcial para prevenir race conditions
-- Solo puede haber UNA ocupación abierta (sin egreso) por plaza
CREATE UNIQUE INDEX IF NOT EXISTS idx_ocupacion_plaza_abierta 
    ON public.ocupacion(plaza_id) 
    WHERE hora_egreso IS NULL;

-- Índices para optimizar consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_ocupacion_playa_id 
    ON public.ocupacion(playa_id);

CREATE INDEX IF NOT EXISTS idx_ocupacion_playero_id 
    ON public.ocupacion(playero_id);

CREATE INDEX IF NOT EXISTS idx_ocupacion_hora_egreso 
    ON public.ocupacion(hora_egreso);

CREATE INDEX IF NOT EXISTS idx_ocupacion_patente 
    ON public.ocupacion(patente);

CREATE INDEX IF NOT EXISTS idx_ocupacion_fecha_creacion 
    ON public.ocupacion(fecha_creacion DESC);

-- Índice compuesto para filtrar ocupaciones activas por playa
CREATE INDEX IF NOT EXISTS idx_ocupacion_playa_activas 
    ON public.ocupacion(playa_id, hora_egreso) 
    WHERE hora_egreso IS NULL;

-- ============================================================================
-- Trigger para actualizar fecha_modificacion
-- ============================================================================

CREATE OR REPLACE FUNCTION update_ocupacion_fecha_modificacion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_modificacion = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_ocupacion_fecha_modificacion ON public.ocupacion;
CREATE TRIGGER set_ocupacion_fecha_modificacion
    BEFORE UPDATE ON public.ocupacion
    FOR EACH ROW
    EXECUTE FUNCTION update_ocupacion_fecha_modificacion();

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

ALTER TABLE public.ocupacion ENABLE ROW LEVEL SECURITY;

-- Política: Playeros pueden ver ocupaciones de sus playas asignadas
DROP POLICY IF EXISTS "Playeros pueden ver ocupaciones de sus playas" ON public.ocupacion;
CREATE POLICY "Playeros pueden ver ocupaciones de sus playas"
    ON public.ocupacion
    FOR SELECT
    TO public
    USING (
        EXISTS (
            SELECT 1 
            FROM public.playero_playa pp
            WHERE pp.playero_id = auth.uid()
            AND pp.playa_id = ocupacion.playa_id
        )
    );

-- Política: Playeros pueden crear ocupaciones en sus playas asignadas
DROP POLICY IF EXISTS "Playeros pueden crear ocupaciones" ON public.ocupacion;
CREATE POLICY "Playeros pueden crear ocupaciones"
    ON public.ocupacion
    FOR INSERT
    TO public
    WITH CHECK (
        playero_id = auth.uid()
        AND EXISTS (
            SELECT 1 
            FROM public.playero_playa pp
            WHERE pp.playero_id = auth.uid()
            AND pp.playa_id = ocupacion.playa_id
        )
    );

-- Política: Playeros pueden actualizar (agregar egreso) sus propias ocupaciones
DROP POLICY IF EXISTS "Playeros pueden actualizar sus ocupaciones" ON public.ocupacion;
CREATE POLICY "Playeros pueden actualizar sus ocupaciones"
    ON public.ocupacion
    FOR UPDATE
    TO public
    USING (playero_id = auth.uid())
    WITH CHECK (playero_id = auth.uid());

-- Política: Dueños pueden ver todas las ocupaciones de sus playas
DROP POLICY IF EXISTS "Dueños pueden ver todas las ocupaciones" ON public.ocupacion;
CREATE POLICY "Dueños pueden ver todas las ocupaciones"
    ON public.ocupacion
    FOR SELECT
    TO public
    USING (
        EXISTS (
            SELECT 1 
            FROM public.playa p
            WHERE p.playa_id = ocupacion.playa_id
            AND p.playa_dueno_id = auth.uid()
        )
    );

-- Política: Dueños pueden actualizar ocupaciones de sus playas
DROP POLICY IF EXISTS "Dueños pueden actualizar ocupaciones de sus playas" ON public.ocupacion;
CREATE POLICY "Dueños pueden actualizar ocupaciones de sus playas"
    ON public.ocupacion
    FOR UPDATE
    TO public
    USING (
        EXISTS (
            SELECT 1 
            FROM public.playa p
            WHERE p.playa_id = ocupacion.playa_id
            AND p.playa_dueno_id = auth.uid()
        )
    );

-- ============================================================================
-- Comentarios
-- ============================================================================

COMMENT ON TABLE public.ocupacion IS 'Registros de ingreso y egreso de vehículos en las plazas de estacionamiento';
COMMENT ON COLUMN public.ocupacion.ocupacion_id IS 'Identificador único de la ocupación';
COMMENT ON COLUMN public.ocupacion.playa_id IS 'ID de la playa donde ocurre la ocupación';
COMMENT ON COLUMN public.ocupacion.plaza_id IS 'ID de la plaza ocupada';
COMMENT ON COLUMN public.ocupacion.playero_id IS 'ID del playero que registró el ingreso';
COMMENT ON COLUMN public.ocupacion.patente IS 'Patente del vehículo (formato argentino: ABC123 o AA123BB)';
COMMENT ON COLUMN public.ocupacion.tipo_vehiculo IS 'Tipo de vehículo: AUTOMOVIL, MOTOCICLETA, CAMIONETA';
COMMENT ON COLUMN public.ocupacion.hora_ingreso IS 'Timestamp de ingreso del vehículo (establecido por el servidor)';
COMMENT ON COLUMN public.ocupacion.hora_egreso IS 'Timestamp de egreso del vehículo (NULL = ocupación activa)';
COMMENT ON COLUMN public.ocupacion.fecha_creacion IS 'Fecha de creación del registro';
COMMENT ON COLUMN public.ocupacion.fecha_modificacion IS 'Fecha de última modificación del registro';

COMMENT ON INDEX idx_ocupacion_plaza_abierta IS 'Previene race conditions: solo una ocupación abierta por plaza';
COMMENT ON INDEX idx_ocupacion_playa_activas IS 'Optimiza consultas de ocupaciones activas por playa';
