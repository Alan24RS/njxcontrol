export const CACHE_TAGS = {
  PLAYAS: 'playas',
  PLAYAS_PUBLICAS: 'playas-publicas',
  PLAYA_STATS: 'playa-stats',
  PLAYAS_CERCANAS: 'playas-cercanas',
  METODOS_PAGO: 'metodos-pago',
  MODALIDADES_OCUPACION: 'modalidades-ocupacion',
  TIPOS_PLAZA: 'tipos-plaza',
  TIPOS_VEHICULO: 'tipos-vehiculo',
  TARIFAS: 'tarifas',
  PLAZAS: 'plazas'
} as const

export const CACHE_TIMES = {
  PLAYAS: 300, // 5 minutos - datos que cambian ocasionalmente
  PLAYAS_PUBLICAS: 600, // 10 minutos - datos públicos más estables
  PLAYA_STATS: 60, // 1 minuto - estadísticas que deben ser más actuales
  PLAYAS_CERCANAS: 900, // 15 minutos - ubicaciones geográficas estables
  METODOS_PAGO: 1800, // 30 minutos - configuración que cambia poco
  MODALIDADES_OCUPACION: 1800, // 30 minutos - configuración que cambia poco
  TIPOS_PLAZA: 3600, // 1 hora - configuración muy estable
  TIPOS_VEHICULO: 3600, // 1 hora - configuración muy estable
  TARIFAS: 300, // 5 minutos - precios que pueden cambiar
  PLAZAS: 180, // 3 minutos - disponibilidad que cambia frecuentemente
  USER_AUTH: 60 // 1 minuto - datos de usuario/sesión
} as const
