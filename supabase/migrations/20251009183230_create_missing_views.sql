CREATE OR REPLACE VIEW public.playa_publica AS
SELECT 
    p.playa_id,
    p.nombre,
    p.direccion,
    p.horario,
    p.descripcion,
    p.latitud,
    p.longitud,
    p.estado,
    c.nombre AS ciudad_nombre,
    c.provincia AS ciudad_provincia
FROM playa p
JOIN ciudad c ON p.ciudad_id = c.ciudad_id
WHERE p.estado = 'ACTIVO'::playa_estado 
  AND p.fecha_eliminacion IS NULL;

ALTER VIEW public.playa_publica OWNER TO postgres;

GRANT SELECT ON TABLE public.playa_publica TO anon;
GRANT ALL ON TABLE public.playa_publica TO authenticated;
GRANT ALL ON TABLE public.playa_publica TO service_role;

CREATE OR REPLACE VIEW public.v_user_with_roles AS
SELECT 
    u.id AS usuario_id,
    u.email,
    (u.raw_user_meta_data ->> 'name'::text) AS nombre,
    (u.raw_user_meta_data ->> 'phone'::text) AS telefono,
    COALESCE(array_agg(ru.rol) FILTER (WHERE (ru.rol IS NOT NULL)), ARRAY[]::rol[]) AS roles,
    u.created_at AS fecha_creacion,
    u.updated_at AS fecha_modificacion
FROM auth.users u
LEFT JOIN rol_usuario ru ON u.id = ru.usuario_id
WHERE u.id = auth.uid()
GROUP BY u.id, u.email, u.raw_user_meta_data, u.created_at, u.updated_at;

ALTER VIEW public.v_user_with_roles OWNER TO postgres;

GRANT SELECT ON TABLE public.v_user_with_roles TO anon;
GRANT ALL ON TABLE public.v_user_with_roles TO authenticated;
GRANT ALL ON TABLE public.v_user_with_roles TO service_role;

CREATE OR REPLACE VIEW public.playeros_con_invitaciones AS
SELECT 
    pp.playero_id,
    pp.playa_id,
    pp.dueno_invitador_id,
    pp.estado,
    pp.fecha_alta,
    pp.fecha_baja,
    pp.motivo_baja,
    pp.fecha_creacion,
    pp.fecha_modificacion,
    u.usuario_id,
    u.email,
    u.nombre,
    u.telefono,
    'REGISTRADO'::text AS tipo_registro
FROM playero_playa pp
JOIN usuario u ON pp.playero_id = u.usuario_id

UNION ALL

SELECT 
    NULL::uuid AS playero_id,
    unnest(pi.playas_ids) AS playa_id,
    pi.dueno_invitador_id,
    'PENDIENTE'::playero_playa_estado AS estado,
    NULL::timestamp with time zone AS fecha_alta,
    NULL::timestamp with time zone AS fecha_baja,
    NULL::text AS motivo_baja,
    pi.fecha_invitacion AS fecha_creacion,
    pi.fecha_invitacion AS fecha_modificacion,
    NULL::uuid AS usuario_id,
    pi.email,
    pi.nombre,
    NULL::text AS telefono,
    'INVITACION_PENDIENTE'::text AS tipo_registro
FROM playero_invitacion pi
WHERE pi.estado = 'PENDIENTE'::text 
  AND pi.fecha_expiracion > now();

ALTER VIEW public.playeros_con_invitaciones OWNER TO postgres;

GRANT SELECT ON TABLE public.playeros_con_invitaciones TO anon;
GRANT ALL ON TABLE public.playeros_con_invitaciones TO authenticated;
GRANT ALL ON TABLE public.playeros_con_invitaciones TO service_role;

CREATE OR REPLACE VIEW public.playeros_agrupados AS
WITH playeros_registrados AS (
    SELECT 
        pp.playero_id,
        u.usuario_id,
        u.email,
        u.nombre,
        u.telefono,
        'REGISTRADO'::text AS tipo_registro,
        CASE
            WHEN bool_or((pp.estado = 'ACTIVO'::playero_playa_estado)) THEN 'ACTIVO'::playero_playa_estado
            ELSE 'SUSPENDIDO'::playero_playa_estado
        END AS estado_principal,
        max(pp.fecha_alta) AS fecha_alta_principal,
        max(pp.fecha_baja) AS fecha_baja_principal,
        CASE
            WHEN bool_or((pp.estado = 'ACTIVO'::playero_playa_estado)) THEN NULL::text
            ELSE (array_agg(pp.motivo_baja ORDER BY pp.fecha_alta DESC NULLS LAST))[1]
        END AS motivo_baja_principal,
        max(pp.fecha_creacion) AS fecha_creacion_principal,
        max(pp.fecha_modificacion) AS fecha_modificacion_principal,
        (array_agg(pp.dueno_invitador_id ORDER BY pp.fecha_alta DESC NULLS LAST))[1] AS dueno_invitador_id,
        array_agg(
            json_build_object(
                'playa_id', p.playa_id, 
                'nombre', p.nombre, 
                'direccion', p.direccion, 
                'estado', pp.estado, 
                'fecha_alta', pp.fecha_alta, 
                'fecha_baja', pp.fecha_baja
            ) ORDER BY pp.fecha_alta DESC NULLS LAST
        ) AS playas_asignadas,
        count(pp.playa_id) AS total_playas
    FROM playero_playa pp
    JOIN usuario u ON pp.playero_id = u.usuario_id
    JOIN playa p ON pp.playa_id = p.playa_id
    WHERE p.playa_dueno_id = pp.dueno_invitador_id
    GROUP BY pp.playero_id, u.usuario_id, u.email, u.nombre, u.telefono
),
invitaciones_pendientes AS (
    SELECT 
        NULL::uuid AS playero_id,
        NULL::uuid AS usuario_id,
        pi.email,
        pi.nombre,
        NULL::text AS telefono,
        'INVITACION_PENDIENTE'::text AS tipo_registro,
        'PENDIENTE'::playero_playa_estado AS estado_principal,
        NULL::timestamp with time zone AS fecha_alta_principal,
        NULL::timestamp with time zone AS fecha_baja_principal,
        NULL::text AS motivo_baja_principal,
        pi.fecha_invitacion AS fecha_creacion_principal,
        pi.fecha_invitacion AS fecha_modificacion_principal,
        pi.dueno_invitador_id,
        array_agg(
            json_build_object(
                'playa_id', p.playa_id, 
                'nombre', p.nombre, 
                'direccion', p.direccion, 
                'estado', 'PENDIENTE', 
                'fecha_alta', NULL::unknown, 
                'fecha_baja', NULL::unknown
            )
        ) AS playas_asignadas,
        array_length(pi.playas_ids, 1) AS total_playas
    FROM playero_invitacion pi
    JOIN playa p ON p.playa_id = ANY(pi.playas_ids)
    WHERE pi.estado = 'PENDIENTE'::text 
      AND pi.fecha_expiracion > now()
    GROUP BY pi.invitacion_id, pi.dueno_invitador_id, pi.email, pi.nombre, pi.fecha_invitacion, pi.playas_ids
)
SELECT 
    playeros_registrados.playero_id,
    playeros_registrados.dueno_invitador_id,
    playeros_registrados.usuario_id,
    playeros_registrados.email,
    playeros_registrados.nombre,
    playeros_registrados.telefono,
    playeros_registrados.tipo_registro,
    playeros_registrados.estado_principal AS estado,
    playeros_registrados.fecha_alta_principal AS fecha_alta,
    playeros_registrados.fecha_baja_principal AS fecha_baja,
    playeros_registrados.motivo_baja_principal AS motivo_baja,
    playeros_registrados.fecha_creacion_principal AS fecha_creacion,
    playeros_registrados.fecha_modificacion_principal AS fecha_modificacion,
    playeros_registrados.playas_asignadas,
    playeros_registrados.total_playas
FROM playeros_registrados

UNION ALL

SELECT 
    invitaciones_pendientes.playero_id,
    invitaciones_pendientes.dueno_invitador_id,
    invitaciones_pendientes.usuario_id,
    invitaciones_pendientes.email,
    invitaciones_pendientes.nombre,
    invitaciones_pendientes.telefono,
    invitaciones_pendientes.tipo_registro,
    invitaciones_pendientes.estado_principal AS estado,
    invitaciones_pendientes.fecha_alta_principal AS fecha_alta,
    invitaciones_pendientes.fecha_baja_principal AS fecha_baja,
    invitaciones_pendientes.motivo_baja_principal AS motivo_baja,
    invitaciones_pendientes.fecha_creacion_principal AS fecha_creacion,
    invitaciones_pendientes.fecha_modificacion_principal AS fecha_modificacion,
    invitaciones_pendientes.playas_asignadas,
    invitaciones_pendientes.total_playas
FROM invitaciones_pendientes;

ALTER VIEW public.playeros_agrupados OWNER TO postgres;

GRANT SELECT ON TABLE public.playeros_agrupados TO anon;
GRANT ALL ON TABLE public.playeros_agrupados TO authenticated;
GRANT ALL ON TABLE public.playeros_agrupados TO service_role;

CREATE OR REPLACE VIEW public.playeros_con_estado_consolidado AS
WITH playeros_registrados AS (
    SELECT 
        pp.playero_id,
        pp.dueno_invitador_id,
        u.usuario_id,
        u.email,
        u.nombre,
        u.telefono,
        'REGISTRADO'::text AS tipo_registro,
        obtener_estado_consolidado_playero(pp.playero_id, pp.dueno_invitador_id) AS estado,
        min(pp.fecha_alta) AS fecha_alta_principal,
        max(pp.fecha_baja) AS fecha_baja_principal,
        string_agg(DISTINCT pp.motivo_baja, '; '::text) AS motivo_baja_principal,
        min(pp.fecha_creacion) AS fecha_creacion_principal,
        max(pp.fecha_modificacion) AS fecha_modificacion_principal,
        array_agg(
            json_build_object(
                'playa_id', p.playa_id, 
                'nombre', p.nombre, 
                'direccion', p.direccion, 
                'estado', pp.estado, 
                'fecha_alta', pp.fecha_alta, 
                'fecha_baja', pp.fecha_baja
            ) ORDER BY pp.fecha_alta DESC NULLS LAST
        ) AS playas_asignadas,
        count(pp.playa_id) AS total_playas
    FROM playero_playa pp
    JOIN usuario u ON pp.playero_id = u.usuario_id
    JOIN playa p ON pp.playa_id = p.playa_id
    WHERE p.playa_dueno_id = pp.dueno_invitador_id
    GROUP BY pp.playero_id, pp.dueno_invitador_id, u.usuario_id, u.email, u.nombre, u.telefono
),
invitaciones_pendientes AS (
    SELECT 
        NULL::uuid AS playero_id,
        pi.dueno_invitador_id,
        NULL::uuid AS usuario_id,
        pi.email,
        pi.nombre,
        NULL::text AS telefono,
        'INVITACION_PENDIENTE'::text AS tipo_registro,
        'PENDIENTE'::text AS estado,
        NULL::timestamp with time zone AS fecha_alta_principal,
        NULL::timestamp with time zone AS fecha_baja_principal,
        NULL::text AS motivo_baja_principal,
        pi.fecha_invitacion AS fecha_creacion_principal,
        pi.fecha_invitacion AS fecha_modificacion_principal,
        array_agg(
            json_build_object(
                'playa_id', p.playa_id, 
                'nombre', p.nombre, 
                'direccion', p.direccion, 
                'estado', 'PENDIENTE', 
                'fecha_alta', NULL::unknown, 
                'fecha_baja', NULL::unknown
            )
        ) AS playas_asignadas,
        array_length(pi.playas_ids, 1) AS total_playas
    FROM playero_invitacion pi
    JOIN playa p ON p.playa_id = ANY(pi.playas_ids)
    WHERE pi.estado = 'PENDIENTE'::text 
      AND pi.fecha_expiracion > now() 
      AND p.playa_dueno_id = pi.dueno_invitador_id
    GROUP BY pi.invitacion_id, pi.dueno_invitador_id, pi.email, pi.nombre, pi.fecha_invitacion, pi.playas_ids
)
SELECT 
    playeros_registrados.playero_id,
    playeros_registrados.dueno_invitador_id,
    playeros_registrados.usuario_id,
    playeros_registrados.email,
    playeros_registrados.nombre,
    playeros_registrados.telefono,
    playeros_registrados.tipo_registro,
    playeros_registrados.estado,
    playeros_registrados.fecha_alta_principal AS fecha_alta,
    playeros_registrados.fecha_baja_principal AS fecha_baja,
    playeros_registrados.motivo_baja_principal AS motivo_baja,
    playeros_registrados.fecha_creacion_principal AS fecha_creacion,
    playeros_registrados.fecha_modificacion_principal AS fecha_modificacion,
    playeros_registrados.playas_asignadas,
    playeros_registrados.total_playas
FROM playeros_registrados

UNION ALL

SELECT 
    invitaciones_pendientes.playero_id,
    invitaciones_pendientes.dueno_invitador_id,
    invitaciones_pendientes.usuario_id,
    invitaciones_pendientes.email,
    invitaciones_pendientes.nombre,
    invitaciones_pendientes.telefono,
    invitaciones_pendientes.tipo_registro,
    invitaciones_pendientes.estado,
    invitaciones_pendientes.fecha_alta_principal AS fecha_alta,
    invitaciones_pendientes.fecha_baja_principal AS fecha_baja,
    invitaciones_pendientes.motivo_baja_principal AS motivo_baja,
    invitaciones_pendientes.fecha_creacion_principal AS fecha_creacion,
    invitaciones_pendientes.fecha_modificacion_principal AS fecha_modificacion,
    invitaciones_pendientes.playas_asignadas,
    invitaciones_pendientes.total_playas
FROM invitaciones_pendientes;

ALTER VIEW public.playeros_con_estado_consolidado OWNER TO postgres;

GRANT SELECT ON TABLE public.playeros_con_estado_consolidado TO anon;
GRANT ALL ON TABLE public.playeros_con_estado_consolidado TO authenticated;
GRANT ALL ON TABLE public.playeros_con_estado_consolidado TO service_role;

CREATE OR REPLACE VIEW public.v_plazas AS
SELECT 
    p.plaza_id,
    p.identificador,
    p.estado AS plaza_estado,
    p.fecha_creacion,
    p.fecha_modificacion,
    p.fecha_eliminacion,
    p.playa_id,
    p.tipo_plaza_id,
    pl.direccion AS playa_direccion,
    pl.nombre AS playa_nombre,
    pl.estado AS playa_estado,
    tp.nombre AS tipo_plaza_nombre,
    tp.descripcion AS tipo_plaza_descripcion
FROM plaza p
LEFT JOIN playa pl ON p.playa_id = pl.playa_id
LEFT JOIN tipo_plaza tp ON p.tipo_plaza_id = tp.tipo_plaza_id AND p.playa_id = tp.playa_id
WHERE p.fecha_eliminacion IS NULL 
  AND pl.playa_dueno_id = auth.uid() 
  AND pl.fecha_eliminacion IS NULL;

ALTER VIEW public.v_plazas OWNER TO postgres;

GRANT SELECT ON TABLE public.v_plazas TO anon;
GRANT ALL ON TABLE public.v_plazas TO authenticated;
GRANT ALL ON TABLE public.v_plazas TO service_role;

CREATE OR REPLACE VIEW public.v_tarifas AS
SELECT 
    t.playa_id,
    t.tipo_plaza_id,
    t.modalidad_ocupacion,
    t.tipo_vehiculo,
    t.precio_base,
    t.fecha_creacion,
    t.fecha_modificacion,
    tp.nombre AS tipo_plaza_nombre,
    tp.descripcion AS tipo_plaza_descripcion,
    CASE t.modalidad_ocupacion
        WHEN 'POR_HORA'::modalidad_ocupacion THEN 1
        WHEN 'DIARIA'::modalidad_ocupacion THEN 2
        WHEN 'SEMANAL'::modalidad_ocupacion THEN 3
        WHEN 'MENSUAL'::modalidad_ocupacion THEN 4
        ELSE 999
    END AS modalidad_ocupacion_order,
    CASE t.tipo_vehiculo
        WHEN 'AUTOMOVIL'::tipo_vehiculo THEN 1
        WHEN 'MOTOCICLETA'::tipo_vehiculo THEN 2
        WHEN 'CAMIONETA'::tipo_vehiculo THEN 3
        ELSE 999
    END AS tipo_vehiculo_order
FROM tarifa t
LEFT JOIN tipo_plaza tp ON t.tipo_plaza_id = tp.tipo_plaza_id AND t.playa_id = tp.playa_id
WHERE tp.fecha_eliminacion IS NULL;

ALTER VIEW public.v_tarifas OWNER TO postgres;

GRANT SELECT ON TABLE public.v_tarifas TO anon;
GRANT ALL ON TABLE public.v_tarifas TO authenticated;
GRANT ALL ON TABLE public.v_tarifas TO service_role;

