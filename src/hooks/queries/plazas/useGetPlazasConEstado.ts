// Contenido completo de: src/hooks/queries/plazas/useGetPlazasConEstado.ts
import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { getPlazasConEstado } from '@/services/plazas/getPlazasConEstado'
import type { PlazaConEstado } from '@/services/plazas/types'
import type { ApiResponse } from '@/types/api'

export const useGetPlazasConEstado = (
  playaId: string,
  options?: Omit<
    UseQueryOptions<ApiResponse<PlazaConEstado[]>>,
    'queryKey' | 'queryFn'
  >
) => {
  return useQuery<ApiResponse<PlazaConEstado[]>>({
    queryKey: ['plazas-con-estado', playaId],
    queryFn: async () => await getPlazasConEstado(playaId),
    ...options
  })
}
