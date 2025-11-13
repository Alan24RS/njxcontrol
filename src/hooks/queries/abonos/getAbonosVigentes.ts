'use client'

import { useQuery } from '@tanstack/react-query'

import { getAbonosVigentesAction } from '@/app/admin/abonos/queries'
import type { AbonoVigente } from '@/services/abonos'
import type { ApiResponse } from '@/types/api'

export function useGetAbonosVigentes(playaId: string | undefined) {
  return useQuery<ApiResponse<AbonoVigente[]>>({
    queryKey: ['abonos-vigentes', playaId],
    queryFn: async () => await getAbonosVigentesAction(playaId),
    staleTime: 30 * 1000
  })
}
