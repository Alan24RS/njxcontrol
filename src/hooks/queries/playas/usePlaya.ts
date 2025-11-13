'use client'
import { useQuery } from '@tanstack/react-query'

import { getPlaya } from '@/services/playas'

export const usePlaya = (playaId: string) => {
  return useQuery({
    queryKey: ['playa', playaId],
    queryFn: async () => await getPlaya(playaId),
    enabled: !!playaId
  })
}
