'use client'

import { useQuery } from '@tanstack/react-query'

import { getOcupacionesAction } from '@/app/admin/ocupaciones/queries'
import type {
  GetOcupacionesParams,
  OcupacionConRelaciones
} from '@/services/ocupaciones/types'
import type { ApiResponse } from '@/types/api'

export function useGetOcupaciones(params: GetOcupacionesParams) {
  return useQuery<ApiResponse<OcupacionConRelaciones[]>>({
    queryKey: ['ocupaciones', params],
    queryFn: () => getOcupacionesAction(params),
    enabled: !!params.playaId,
    refetchInterval: 60000,
    refetchIntervalInBackground: true
  })
}
