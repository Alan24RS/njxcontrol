'use client'

import { useQuery } from '@tanstack/react-query'

import { getRecaudacionAction } from '@/services/analytics/recaudacion/actions'
import type {
  RecaudacionFilters,
  UseRecaudacionResult
} from '@/services/analytics/recaudacion/types'

/**
 * Hook para obtener datos de recaudación
 * Usa TanStack Query para caching y refetch automático
 */
export function useRecaudacion(
  filters: RecaudacionFilters,
  enabled: boolean = true
): UseRecaudacionResult {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [
      'recaudacion',
      {
        fecha_desde: filters.fecha_desde.toISOString(),
        fecha_hasta: filters.fecha_hasta.toISOString(),
        playa_id: filters.playa_id,
        playero_id: filters.playero_id ?? null,
        tipo: filters.tipo ?? null
      }
    ],
    queryFn: async () => {
      // Convertir dates a strings para la server action
      const payload = {
        fecha_desde: filters.fecha_desde.toISOString(),
        fecha_hasta: filters.fecha_hasta.toISOString(),
        playa_id: filters.playa_id,
        playero_id: filters.playero_id ?? null,
        tipo: filters.tipo ?? null
      }
      return await getRecaudacionAction(payload)
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos (antes cacheTime)
    enabled, // Permite deshabilitar query
    retry: 2 // Reintentos en caso de error
  })

  return {
    data,
    isLoading,
    isError,
    error: error as Error | null,
    refetch
  }
}
