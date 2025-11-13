'use client'

import { useQuery } from '@tanstack/react-query'

import { DataTable, Spinner } from '@/components/ui'
import { MessageCard } from '@/components/ui/MessageCard'
import { useUserRole } from '@/hooks/useUserRole'
import { getAbonados } from '@/services/abonados'
import type { Abonado, GetAbonadosParams } from '@/services/abonados/types'
import { useSelectedPlaya } from '@/stores/useSelectedPlaya'
import type { Pagination } from '@/types/api'

import { PageParams } from '../../page'
import ToolbarContainer from '../ToolbarContainer'

import getColumns from './Columns'

export type TableData = {
  data: Abonado[]
  pagination: Pagination
}

export default function TableContainer({
  params
}: {
  params: Partial<PageParams>
}) {
  const { selectedPlaya, isLoading: playaLoading } = useSelectedPlaya()
  const { isDueno, isLoading: roleLoading } = useUserRole()

  const isOwner = isDueno()
  const playaIdToFilter = isOwner ? undefined : selectedPlaya?.id

  const {
    data: response,
    error,
    isLoading: abonadosLoading,
    isError
  } = useQuery({
    queryKey: ['abonados', params, playaIdToFilter],
    queryFn: () =>
      getAbonados({
        ...params,
        playaId: playaIdToFilter
      } as GetAbonadosParams)
  })

  const isLoading = playaLoading || abonadosLoading || roleLoading

  if (isLoading) {
    return (
      <div className="flex w-full grow items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (!isOwner && !selectedPlaya) {
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
  const columns = getColumns()

  return (
    <>
      <ToolbarContainer params={params} />
      <DataTable
        data={abonados}
        columns={columns}
        pagination={
          response.pagination || {
            currentPage: 1,
            lastPage: 1,
            total: 0,
            pageSize: 10
          }
        }
      />
    </>
  )
}
