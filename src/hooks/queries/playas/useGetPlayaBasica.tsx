import { useQuery, type UseQueryOptions } from '@tanstack/react-query'

import { getPlaya } from '@/services/playas/getPlayaBasica'
import type { PlayaBasica } from '@/services/playas/types'
import type { ApiResponse } from '@/types/api'

export function useGetPlayaBasica(
  playaId: string | undefined,
  options?: Omit<
    UseQueryOptions<ApiResponse<PlayaBasica | null>>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery<ApiResponse<PlayaBasica | null>>({
    queryKey: ['playa', playaId],
    queryFn: async () => await getPlaya(playaId!),
    enabled: !!playaId,
    ...options
  })
}
