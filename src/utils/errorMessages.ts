import { DB_ERROR_TRANSLATIONS } from '@/constants/translations'

export function translateDBError(error: unknown): string {
  const errorMessage =
    error instanceof Error
      ? error.message
      : String(error || 'Error desconocido')

  if (!errorMessage) return 'Error desconocido'

  // Buscar traducción exacta primero
  const exactTranslation = DB_ERROR_TRANSLATIONS[errorMessage]
  if (exactTranslation) {
    return exactTranslation
  }

  // Buscar coincidencias parciales
  for (const [englishError, spanishError] of Object.entries(
    DB_ERROR_TRANSLATIONS
  )) {
    if (errorMessage.toLowerCase().includes(englishError.toLowerCase())) {
      return spanishError
    }
  }

  // Si no hay traducción disponible, devolver el mensaje original
  return errorMessage
}
