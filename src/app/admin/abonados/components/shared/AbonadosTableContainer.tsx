'use client'

import { useQuery } from '@tanstack/react-query'

import { Spinner } from '@/components/ui'
import { MessageCard } from '@/components/ui/MessageCard'
import { getAbonados } from '@/services/abonados'
import type { Abonado, GetAbonadosParams } from '@/services/abonados/types'
import { useSelectedPlaya } from '@/stores/useSelectedPlaya'
import type { Pagination } from '@/types/api'

export type TableData = {
  data: Abonado[]
  pagination: Pagination
}

type AbonadosTableContainerProps = {
  params: any
  filterByPlaya?: boolean
  children: (data: {
    abonados: Abonado[]
    pagination: Pagination
  }) => React.ReactNode
}

export default function AbonadosTableContainer({
  params,
  filterByPlaya = false,
  children
}: AbonadosTableContainerProps) {
  const { selectedPlaya, isLoading: playaLoading } = useSelectedPlaya()

  const playaId = filterByPlaya ? selectedPlaya?.id : undefined

  const {
    data: response,
    error,
    isLoading: abonadosLoading,
    isError
  } = useQuery({
    queryKey: ['abonados', params, playaId],
    queryFn: () =>
      getAbonados({
        ...params,
        playaId
      } as GetAbonadosParams)
  })

  const isLoading = filterByPlaya
    ? playaLoading || abonadosLoading
    : abonadosLoading

  if (isLoading) {
    return (
      <div className="flex w-full grow items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (filterByPlaya && !selectedPlaya) {
    return (
      <div className="flex w-full grow items-center justify-center px-4 sm:px-0">
        <div className="text-center">
          <h3 className="text-lg font-semibold">Selecciona una playa</h3>
          <p className="text-muted-foreground">
            Debes seleccionar una playa para ver los abonados
          </p>
        </div>
      </div>
    )
  }

  if (
    isError ||
    error ||
    response?.error ||
    !response?.data ||
    !response?.pagination
  ) {
    return <MessageCard />
  }

  const abonados = response?.data || []
  const pagination = response.pagination || {
    currentPage: 1,
    lastPage: 1,
    total: 0,
    pageSize: 10
  }

  return <>{children({ abonados, pagination })}</>
}
