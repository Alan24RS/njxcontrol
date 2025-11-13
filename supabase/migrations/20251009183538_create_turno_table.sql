CREATE TABLE IF NOT EXISTS public.turno (
    playa_id uuid NOT NULL,
    playero_id uuid DEFAULT auth.uid() NOT NULL,
    fecha_hora_ingreso timestamp with time zone DEFAULT now() NOT NULL,
    fecha_hora_salida timestamp with time zone,
    efectivo_inicial numeric DEFAULT 0 NOT NULL,
    efectivo_final numeric,
    
    CONSTRAINT turno_pkey PRIMARY KEY (playa_id, playero_id, fecha_hora_ingreso),
    
    CONSTRAINT turno_playero_playa_fkey 
        FOREIGN KEY (playero_id, playa_id) 
        REFERENCES public.playero_playa(playero_id, playa_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS turno_unico_abierto 
    ON public.turno (playa_id, playero_id) 
    WHERE (fecha_hora_salida IS NULL);

ALTER TABLE public.turno ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Los playeros solo pueden ver sus propios turnos" ON public.turno;
CREATE POLICY "Los playeros solo pueden ver sus propios turnos"
    ON public.turno
    FOR SELECT
    TO public
    USING (auth.uid() = playero_id);

DROP POLICY IF EXISTS "Los playeros solo pueden insertar un turno si no tienen otro ab" ON public.turno;
CREATE POLICY "Los playeros solo pueden insertar un turno si no tienen otro ab"
    ON public.turno
    FOR INSERT
    TO public
    WITH CHECK (
        (auth.uid() = playero_id) 
        AND 
        (NOT EXISTS (
            SELECT 1 
            FROM turno t 
            WHERE t.playero_id = auth.uid() 
            AND t.fecha_hora_salida IS NULL
        ))
    );

DROP POLICY IF EXISTS "Los playeros solo pueden actualizar sus propios turnos" ON public.turno;
CREATE POLICY "Los playeros solo pueden actualizar sus propios turnos"
    ON public.turno
    FOR UPDATE
    TO public
    USING (auth.uid() = playero_id)
    WITH CHECK (auth.uid() = playero_id);

COMMENT ON TABLE public.turno IS 'Tabla que registra los turnos de trabajo de los playeros en las playas, incluyendo ingreso, salida y manejo de efectivo';

GRANT ALL ON TABLE public.turno TO authenticated;
GRANT ALL ON TABLE public.turno TO service_role;

