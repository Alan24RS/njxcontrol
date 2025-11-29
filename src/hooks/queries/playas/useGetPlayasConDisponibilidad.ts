'use client'

import { useQuery } from '@tanstack/react-query'

import { getPlayasConDisponibilidad } from '@/services/playas'
import type {
  ApiResponse,
  PlayaConDisponibilidad
} from '@/services/playas/types'

export function useGetPlayasConDisponibilidad() {
  return useQuery<ApiResponse<PlayaConDisponibilidad[]>>({
    queryKey: ['playas-con-disponibilidad'],
    queryFn: async () => {
      return await getPlayasConDisponibilidad()
    },
    staleTime: 3 * 60 * 1000, // 3 minutos
    refetchInterval: 3 * 60 * 1000, // Refrescar cada 3 minutos
    refetchOnWindowFocus: true
  })
}
