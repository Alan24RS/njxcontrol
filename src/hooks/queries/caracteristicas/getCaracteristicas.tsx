import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { getCaracteristicas } from '@/services/caracteristicas'
import type { Caracteristica } from '@/services/caracteristicas/types'
import type { ApiResponse } from '@/types/api'

export const useGetCaracteristicas = (
  options?: Omit<
    UseQueryOptions<ApiResponse<Caracteristica[]>>,
    'queryKey' | 'queryFn'
  >
) => {
  return useQuery<ApiResponse<Caracteristica[]>>({
    queryKey: ['caracteristicas'],
    queryFn: async () => await getCaracteristicas(),
    staleTime: 5 * 60 * 1000, // 5 minutos - las características no cambian frecuentemente
    ...options
  })
}
