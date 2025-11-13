export const DB_ERROR_TRANSLATIONS: Record<string, string> = {
  // Constraint violations
  'duplicate key value violates unique constraint "ux_playa_dueno_direccion"':
    'Ya existe una playa registrada en esa dirección para tu cuenta',
  // General constraint violations
  'duplicate key value violates unique constraint':
    'Ya existe un registro con esa combinación de datos',
  // Foreign key violations
  'violates foreign key constraint': 'Referencia a datos que no existen',
  // Not null violations
  'null value in column': 'Campo requerido no puede estar vacío',
  // Check constraint violations
  'violates check constraint':
    'Los datos no cumplen con las reglas de validación',
  // Authentication errors
  'Invalid login credentials': 'Credenciales inválidas',
  'JWT expired': 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente',
  'Invalid JWT': 'Sesión inválida. Por favor, inicia sesión nuevamente',
  // Permission errors
  'permission denied': 'No tienes permisos para realizar esta acción',
  'insufficient privileges': 'No tienes los privilegios necesarios',
  // Connection errors
  'connection refused': 'Error de conexión con la base de datos',
  ECONNREFUSED:
    'No se puede conectar con la base de datos. Verifica que Supabase esté ejecutándose',
  'fetch failed':
    'Error de conexión con el servidor. Verifica tu conexión a internet y que el servidor esté disponible',
  'network error': 'Error de red. Verifica tu conexión a internet',
  timeout: 'La operación tardó demasiado tiempo',
  // General errors
  'internal server error': 'Error interno del servidor',
  'bad request': 'Solicitud inválida',
  'not found': 'Recurso no encontrado'
}
