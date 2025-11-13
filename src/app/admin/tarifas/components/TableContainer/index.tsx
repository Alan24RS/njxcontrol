'use client'

import { Spinner } from '@/components/ui'
import { DataTable } from '@/components/ui/DataTable'
import { Role } from '@/constants/rol'
import { useGetTarifas } from '@/hooks/queries/tarifas/getTarifas'
import type { Tarifa } from '@/services/tarifas/types'
import { useSelectedPlaya } from '@/stores/useSelectedPlaya'
import type { Pagination } from '@/types/api'

import { PageParams } from '../../page'

import getColumns from './Columns'

export type TableData = {
  data: Tarifa[]
  pagination: Pagination
}

export default function TableContainer({
  params,
  roles
}: {
  params: Partial<PageParams>
  roles: Role[]
}) {
  const { selectedPlaya, isLoading: playaLoading } = useSelectedPlaya()

  const queryParams = {
    ...params,
    playaId: selectedPlaya?.id || ''
  }

  const {
    data: response,
    error,
    isLoading: tarifasLoading,
    isError
  } = useGetTarifas(queryParams, {
    enabled: !playaLoading && !!selectedPlaya?.id
  })

  const isLoading = playaLoading || tarifasLoading

  if (isLoading) {
    return (
      <div className="flex w-full grow items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (!selectedPlaya) {
    return (
      <div className="flex w-full grow items-center justify-center px-4 sm:px-0">
        <div className="text-center">
          <h3 className="text-lg font-semibold">Selecciona una playa</h3>
          <p className="text-muted-foreground">
            Debes seleccionar una playa para ver las tarifas
          </p>
        </div>
      </div>
    )
  }

  if (isError || error || !response?.data || !response?.pagination) {
    return (
      <div className="flex w-full grow items-center justify-center px-4 sm:px-0">
        <div className="text-center">
          <h3 className="text-lg font-semibold">Hubo un problema</h3>
          <p className="text-muted-foreground">
            {response?.error ||
              'Intente nuevamente o comuníquese con el area de sistemas'}
          </p>
        </div>
      </div>
    )
  }

  const columns = getColumns({ roles })

  return (
    <DataTable
      data={response.data}
      pagination={response.pagination}
      columns={columns}
    />
  )
}
