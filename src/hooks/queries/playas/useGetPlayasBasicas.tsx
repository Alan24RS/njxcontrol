'use client'

import { useQuery } from '@tanstack/react-query'

import { getPlayasBasicasAction } from '@/app/admin/playas/queries'
import type { GetPlayasParams, PlayaBasica } from '@/services/playas/types'
import type { ApiResponse } from '@/types/api'

export function useGetPlayasBasicas(params?: GetPlayasParams) {
  return useQuery<ApiResponse<PlayaBasica[]>>({
    queryKey: ['playas-basicas', params],
    queryFn: async () => {
      return await getPlayasBasicasAction(params)
    },
    staleTime: 15 * 60 * 1000
  })
}
