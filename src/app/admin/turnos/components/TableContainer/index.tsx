'use client'

import { useEffect, useMemo, useState } from 'react'

import { Spinner } from '@/components/ui'
import { DataTable } from '@/components/ui/DataTable'
import { useGetTurnos } from '@/hooks/queries/turnos/useGetTurnos'
import { useSelectedPlaya } from '@/stores/useSelectedPlaya'
import type { Pagination } from '@/types/api'

import type { PageParams } from '../../page'

import { getColumns } from './Columns'

interface TableContainerProps {
  params: Partial<PageParams>
}

export default function TableContainer({ params }: TableContainerProps) {
  const { selectedPlaya, isLoading: playaLoading } = useSelectedPlaya()

  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date())
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  const queryParams = useMemo(
    () => ({
      playaId: params.playa || selectedPlaya?.id || '',
      fromDate: params.fromDate,
      toDate: params.toDate,
      includeFilters: true
    }),
    [params.fromDate, params.toDate, params.playa, selectedPlaya?.id]
  )

  const {
    data: response,
    error,
    isLoading: turnosLoading,
    isError
  } = useGetTurnos(queryParams, {
    enabled: !playaLoading && !!selectedPlaya?.id
  })

  const columns = useMemo(() => getColumns(now), [now])

  const isLoading = playaLoading || turnosLoading

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
            Debes seleccionar una playa para ver los turnos
          </p>
        </div>
      </div>
    )
  }

  if (isError || error || !response?.data) {
    return (
      <div className="flex w-full grow items-center justify-center px-4 sm:px-0">
        <div className="text-center">
          <h3 className="text-lg font-semibold">Hubo un problema</h3>
          <p className="text-muted-foreground">
            {response?.error ||
              error?.message ||
              'Intente nuevamente o comuníquese con el área de sistemas'}
          </p>
        </div>
      </div>
    )
  }

  const pagination: Pagination = {
    currentPage: 1,
    lastPage: 1,
    total: response.data.length,
    pageSize: response.data.length || 1
  }

  return (
    <DataTable data={response.data} pagination={pagination} columns={columns} />
  )
}
