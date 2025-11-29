'use client'

import { useQuery } from '@tanstack/react-query'

import { getRecaudacionPorPlayaAction } from '@/services/analytics/recaudacion-por-playa/actions'
import type {
  RecaudacionPorPlayaFilters,
  UseRecaudacionPorPlayaResult
} from '@/services/analytics/recaudacion-por-playa/types'

/**
 * Hook para obtener datos de recaudación por playa
 * Usa TanStack Query para caching y refetch automático
 */
export function useRecaudacionPorPlaya(
  filters: RecaudacionPorPlayaFilters,
  enabled: boolean = true
): UseRecaudacionPorPlayaResult {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [
      'recaudacion-por-playa',
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
      return await getRecaudacionPorPlayaAction(payload)
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
