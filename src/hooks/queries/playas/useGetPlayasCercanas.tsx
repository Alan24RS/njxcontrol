'use client'

import { useQuery } from '@tanstack/react-query'

import { getPlayasCercanasAction } from '@/app/admin/playas/queries'
import type {
  GetPlayasCercanasParams,
  PlayaPublica
} from '@/services/playas/types'
import type { ApiResponse } from '@/types/api'

export function useGetPlayasCercanas(params: GetPlayasCercanasParams) {
  return useQuery<ApiResponse<PlayaPublica[]>>({
    queryKey: ['playas-cercanas', params],
    queryFn: async () => {
      return await getPlayasCercanasAction(params)
    },
    enabled: !!(params.latitud && params.longitud),
    staleTime: 5 * 60 * 1000
  })
}
