ALTER VIEW v_playeros SET (security_invoker = true);

COMMENT ON VIEW v_playeros IS 'Vista unificada de playeros registrados e invitaciones pendientes con campos planos para facilitar ordenamiento y filtrado. Incluye información del usuario y playas asignadas. Usa security_invoker=true para respetar las políticas RLS de las tablas base.';

ALTER VIEW v_playas SET (security_invoker = true);

COMMENT ON VIEW v_playas IS 'Vista de playas con información relacionada de ciudad para facilitar ordenamiento y filtrado. Usa security_invoker=true para respetar las políticas RLS de las tablas base.';

ALTER VIEW v_ocupaciones SET (security_invoker = true);

COMMENT ON VIEW v_ocupaciones IS 'Vista con información completa de ocupaciones incluyendo datos de plaza, playero y playa. Usa security_invoker=true para respetar las políticas RLS de las tablas base.';

ALTER VIEW v_tipos_vehiculo SET (security_invoker = true);

COMMENT ON VIEW v_tipos_vehiculo IS 'Vista de tipos de vehículo con nombre traducido para ordenamiento alfabético. Usa security_invoker=true para respetar las políticas RLS de las tablas base.';

ALTER VIEW v_modalidades_ocupacion SET (security_invoker = true);

COMMENT ON VIEW v_modalidades_ocupacion IS 'Vista de modalidades de ocupación con nombre traducido para ordenamiento alfabético. Usa security_invoker=true para respetar las políticas RLS de las tablas base.';

ALTER VIEW v_tarifas SET (security_invoker = true);

COMMENT ON VIEW v_tarifas IS 'Vista de tarifas con información relacionada de tipo de plaza. Incluye campos de ordenamiento para enums modalidad_ocupacion y tipo_vehiculo. Usa security_invoker=true para respetar las políticas RLS de las tablas base.';

ALTER VIEW playeros_con_invitaciones SET (security_invoker = true);

COMMENT ON VIEW playeros_con_invitaciones IS 'Vista que combina playeros registrados e invitaciones pendientes. Usa security_invoker=true para respetar las políticas RLS de las tablas base.';

ALTER VIEW playeros_con_estado_consolidado SET (security_invoker = true);

COMMENT ON VIEW playeros_con_estado_consolidado IS 'Vista que combina playeros registrados e invitaciones pendientes con estado consolidado. Usa security_invoker=true para respetar las políticas RLS de las tablas base.';

ALTER VIEW playeros_agrupados SET (security_invoker = true);

COMMENT ON VIEW playeros_agrupados IS 'Vista que muestra un registro por playero con todas sus playas asignadas del dueño actual, incluyendo invitaciones pendientes. El estado se determina según la lógica: ACTIVO si está activo en al menos una playa, SUSPENDIDO si está suspendido en todas, PENDIENTE para invitaciones. Usa security_invoker=true para respetar las políticas RLS de las tablas base.';
