'use client'

import { useQuery, type UseQueryOptions } from '@tanstack/react-query'

import { getOcupacionByIdAction } from '@/app/admin/ocupaciones/queries'
import type { OcupacionConRelaciones } from '@/services/ocupaciones/types'
import type { ApiResponse } from '@/types/api'

export const useGetOcupacionById = (
  ocupacionId: string | undefined,
  options?: Omit<
    UseQueryOptions<ApiResponse<OcupacionConRelaciones>>,
    'queryKey' | 'queryFn'
  >
) => {
  return useQuery<ApiResponse<OcupacionConRelaciones>>({
    queryKey: ['ocupacion', ocupacionId],
    queryFn: async () => {
      if (!ocupacionId) {
        return { data: null, error: 'ID de ocupación no proporcionado' }
      }
      return await getOcupacionByIdAction(ocupacionId)
    },
    enabled: !!ocupacionId,
    ...options
  })
}
