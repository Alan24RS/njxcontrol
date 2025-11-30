'use client'

import { useSearchParams } from 'next/navigation'

import { useQuery } from '@tanstack/react-query'

import { getAbonosVigentesAction } from '@/app/admin/abonos/queries'
import type { AbonoVigente } from '@/services/abonos'
import type { ApiResponse } from '@/types/api'

export function useGetAbonosVigentes(playaId: string | undefined) {
  const searchParams = useSearchParams()
  const sortByParams = searchParams.getAll('sortBy')

  let sortBy: string | undefined
  let sortOrder: 'asc' | 'desc' | undefined

  if (sortByParams.length > 0) {
    const firstSort = sortByParams[0]
    const sortParts = firstSort.split(' ').filter(Boolean)
    if (sortParts.length >= 1) {
      sortBy = sortParts[0]
      if (
        sortParts.length >= 2 &&
        (sortParts[1] === 'asc' || sortParts[1] === 'desc')
      ) {
        sortOrder = sortParts[1]
      }
    }
  }

  return useQuery<ApiResponse<AbonoVigente[]>>({
    queryKey: ['abonos-vigentes', playaId, sortBy, sortOrder],
    queryFn: async () =>
      await getAbonosVigentesAction(playaId, sortBy, sortOrder),
    staleTime: 30 * 1000
  })
}
