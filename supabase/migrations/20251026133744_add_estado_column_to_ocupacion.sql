-- Agrega la columna estado a public.ocupacion y sincroniza la vista v_ocupaciones
-- para exponer este nuevo valor directamente desde la tabla.

ALTER TABLE public.ocupacion
    ADD COLUMN IF NOT EXISTS estado public.ocupacion_estado NOT NULL DEFAULT 'ACTIVO';

-- Sincroniza el estado existente en base a hora_egreso (ocupaciones ya finalizadas)
UPDATE public.ocupacion
SET estado = CASE
        WHEN hora_egreso IS NULL THEN 'ACTIVO'::public.ocupacion_estado
        ELSE 'FINALIZADO'::public.ocupacion_estado
    END
WHERE estado IS NULL
   OR (estado = 'ACTIVO'::public.ocupacion_estado AND hora_egreso IS NOT NULL);

-- Actualiza la vista para exponer el campo estado directamente
DROP VIEW IF EXISTS public.v_ocupaciones;

CREATE VIEW public.v_ocupaciones AS
SELECT
    -- Datos de ocupacion
    o.ocupacion_id,
    o.playa_id,
    o.plaza_id,
    o.playero_id,
    o.patente,
    o.tipo_vehiculo,
    o.modalidad_ocupacion,
    o.numero_pago,
    o.hora_ingreso,
    o.hora_egreso,
    o.fecha_creacion,
    o.fecha_modificacion,

    -- Plaza info
    pl.identificador AS plaza_identificador,
    tp.tipo_plaza_id,
    tp.nombre AS tipo_plaza_nombre,
    pl.estado AS plaza_estado,

    -- Playero info (LEFT JOIN para no perder filas por RLS)
    u.nombre AS playero_nombre,
    u.email AS playero_email,

    -- Playa info
    py.nombre AS playa_nombre,
    py.direccion AS playa_direccion,

    -- Estado de la ocupacion (mantiene tipo enum)
    o.estado AS estado,

    -- Duracion calculada en minutos
    CASE
        WHEN o.hora_egreso IS NOT NULL THEN
            EXTRACT(EPOCH FROM (o.hora_egreso - o.hora_ingreso)) / 60
        ELSE
            EXTRACT(EPOCH FROM (now() - o.hora_ingreso)) / 60
    END AS duracion_minutos,

    -- Duracion formateada (HH:MM)
    CASE
        WHEN o.hora_egreso IS NOT NULL THEN
            TO_CHAR(
                JUSTIFY_INTERVAL(o.hora_egreso - o.hora_ingreso),
                'HH24:MI'
            )
        ELSE
            TO_CHAR(
                JUSTIFY_INTERVAL(now() - o.hora_ingreso),
                'HH24:MI'
            )
    END AS duracion_formateada

FROM public.ocupacion o
JOIN public.plaza pl ON pl.plaza_id = o.plaza_id
JOIN public.tipo_plaza tp
  ON tp.tipo_plaza_id = pl.tipo_plaza_id
  AND tp.playa_id = pl.playa_id
LEFT JOIN public.usuario u ON u.usuario_id = o.playero_id
JOIN public.playa py ON py.playa_id = o.playa_id
WHERE pl.fecha_eliminacion IS NULL
  AND tp.fecha_eliminacion IS NULL
  AND py.fecha_eliminacion IS NULL;

GRANT SELECT ON public.v_ocupaciones TO authenticated;

ALTER VIEW public.v_ocupaciones SET (security_invoker = true);

COMMENT ON VIEW public.v_ocupaciones IS 'Vista con informacion completa de ocupaciones incluyendo datos de plaza, playero y playa. Usa security_invoker=true para respetar las politicas RLS de las tablas base.';

-- Agregar constraint para garantizar integridad: ocupaciones finalizadas deben tener hora_egreso
ALTER TABLE public.ocupacion
ADD CONSTRAINT check_finalizado_requires_hora_egreso
CHECK (
  (estado = 'FINALIZADO'::public.ocupacion_estado AND hora_egreso IS NOT NULL)
  OR estado != 'FINALIZADO'::public.ocupacion_estado
);

-- Agregar índice parcial para mejorar queries de ocupaciones activas
CREATE INDEX IF NOT EXISTS idx_ocupacion_estado_activo 
ON public.ocupacion(estado, playa_id) 
WHERE estado = 'ACTIVO';

COMMENT ON CONSTRAINT check_finalizado_requires_hora_egreso ON public.ocupacion 
IS 'Garantiza que una ocupacion en estado FINALIZADO siempre tenga hora_egreso poblada';
