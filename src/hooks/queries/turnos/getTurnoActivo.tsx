import { useQuery, type UseQueryOptions } from '@tanstack/react-query'

import { getTurnoActivoAction } from '@/app/admin/turnos/queries'
import type { Turno } from '@/services/turnos'
import type { ApiResponse } from '@/types/api'

export function useTurnoActivo(
  options?: Omit<
    UseQueryOptions<ApiResponse<Turno | null>>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery<ApiResponse<Turno | null>>({
    queryKey: ['turno-activo'],
    queryFn: getTurnoActivoAction,
    staleTime: 30 * 1000,
    ...options
  })
}
