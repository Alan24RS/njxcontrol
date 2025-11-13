'use client'

import { useMemo } from 'react'

import { useQuery } from '@tanstack/react-query'

import { getUserPlayasAction } from '@/app/admin/playas/queries'
import type { PlayaBasica } from '@/services/playas/types'
import type { ApiResponse } from '@/types/api'

export function useGetUserPlayas(assignedPlayas?: string[]) {
  const { data, ...rest } = useQuery<ApiResponse<PlayaBasica[]>>({
    queryKey: ['user-playas'],
    queryFn: async () => {
      return await getUserPlayasAction()
    },
    staleTime: 5 * 60 * 1000
  })

  const filteredPlayas = useMemo(() => {
    if (!data?.data) return []
    if (!assignedPlayas || assignedPlayas.length === 0) return data.data

    return data.data.filter((p) => !assignedPlayas.includes(p.id))
  }, [data?.data, assignedPlayas])

  return {
    data: {
      data: filteredPlayas,
      error: data?.error || null
    } as ApiResponse<PlayaBasica[]>,
    playas: filteredPlayas,
    ...rest
  }
}
