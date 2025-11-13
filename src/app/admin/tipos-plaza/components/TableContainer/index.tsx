'use client'

import { useMemo } from 'react'

import { AlertTriangle } from 'lucide-react'

import getColumns from '@/app/admin/tipos-plaza/components/TableContainer/Columns'
import { Alert, AlertDescription, AlertTitle, Spinner } from '@/components/ui'
import { DataTable } from '@/components/ui/DataTable'
import { Role } from '@/constants/rol'
import { useGetTiposPlaza } from '@/hooks/queries/tipos-plaza/getTiposPlaza'
import type { TipoPlaza } from '@/services/tipos-plaza/types'
import { useSelectedPlaya } from '@/stores'
import type { Pagination } from '@/types/api'

import { PageParams } from '../../page'

export type TableData = {
  data: TipoPlaza[]
  pagination: Pagination
}

export default function TableContainer({
  params,
  roles
}: {
  params: Partial<PageParams>
  roles: Role[]
}) {
  const { selectedPlaya, isLoading: isPlayaLoading } = useSelectedPlaya()

  const queryParams = useMemo(
    () => ({
      ...params,
      playaId: selectedPlaya?.id
    }),
    [params, selectedPlaya?.id]
  )

  const {
    data: result,
    isLoading: isLoadingTiposPlaza,
    error
  } = useGetTiposPlaza(queryParams, {
    enabled: !!selectedPlaya?.id && !isPlayaLoading
  })

  const isLoading = isPlayaLoading || isLoadingTiposPlaza
  const hasError =
    error || result?.error || !result?.pagination || !result?.data
  const errorMessage =
    result?.error ||
    error?.message ||
    'Intente nuevamente o comuníquese con el area de sistemas'

  // Si está cargando la playa o los tipos de plaza
  if (isLoading) {
    return (
      <div className="flex w-full grow items-center justify-center px-4 sm:px-0">
        <Spinner />
      </div>
    )
  }

  if (hasError) {
    return (
      <div className="flex w-full grow items-center justify-center px-4 sm:px-0">
        <Alert className="w-fit">
          <AlertTriangle />
          <AlertTitle>Hubo un problema</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      </div>
    )
  }

  const columns = getColumns({ roles })

  return (
    <DataTable
      data={result.data!}
      pagination={result.pagination!}
      columns={columns}
    />
  )
}
