'use client'

import { useQuery, type UseQueryOptions } from '@tanstack/react-query'

import { getTurnosAction } from '@/app/admin/turnos/queries'
import type { Turno } from '@/services/turnos/types'
import type { ApiResponse } from '@/types/api'

interface GetTurnosParams {
  playaId?: string
  fromDate?: string
  toDate?: string
}

export function useGetTurnos(
  params?: GetTurnosParams,
  options?: Omit<UseQueryOptions<ApiResponse<Turno[]>>, 'queryKey' | 'queryFn'>
) {
  return useQuery<ApiResponse<Turno[]>>({
    queryKey: ['turnos', params],
    queryFn: () => getTurnosAction(params),
    enabled: !!params?.playaId,
    staleTime: 30 * 1000,
    ...options
  })
}
