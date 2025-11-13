import type { PaginationParams } from '@/types/api'

/**
 * Extrae los filtros aplicados de los parámetros de paginación
 * Excluye parámetros de paginación, ordenamiento y búsqueda
 */
export function extractAppliedFilters(
  params: PaginationParams
): Record<string, string[]> {
  const appliedFilters: Record<string, string[]> = {}

  // Parámetros que NO son filtros
  const excludedParams = new Set([
    'page',
    'limit',
    'sortBy',
    'order',
    'query',
    'includeFilters',
    'select',
    'playaId' // ID de la playa no es un filtro, es un parámetro obligatorio
  ])

  // Iterar sobre todos los parámetros
  Object.entries(params).forEach(([key, value]) => {
    if (!excludedParams.has(key) && value !== undefined) {
      if (Array.isArray(value)) {
        // Si ya es un array, lo usamos directamente
        appliedFilters[key] = value.map(String)
      } else {
        // Si es un valor único, lo convertimos a array
        appliedFilters[key] = [String(value)]
      }
    }
  })

  return appliedFilters
}

/**
 * Convierte los filtros aplicados al formato esperado por la RPC
 */
export function formatFiltersForRPC(
  appliedFilters: Record<string, string[]>
): Record<string, string[]> {
  // Por ahora es una conversión directa, pero puede expandirse
  // para manejar transformaciones específicas si es necesario
  return appliedFilters
}
