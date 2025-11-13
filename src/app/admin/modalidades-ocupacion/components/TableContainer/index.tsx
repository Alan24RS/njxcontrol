'use client'

import { AlertTriangle } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle, Spinner } from '@/components/ui'
import { Role } from '@/constants/rol'
import { useGetModalidadesOcupacion } from '@/hooks/queries/modalidades-ocupacion/getModalidadesOcupacion'
import type { ModalidadOcupacionPlaya } from '@/services/modalidades-ocupacion/types'
import { useSelectedPlaya } from '@/stores'
import type { Pagination } from '@/types/api'

import { PageParams } from '../../page'

import ColumnProvider from './ColumnProvider'

export type TableData = {
  data: ModalidadOcupacionPlaya[]
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

  const queryParams = {
    ...params,
    playaId: selectedPlaya?.id
  }

  const {
    data: result,
    isLoading: isLoadingModalidades,
    error
  } = useGetModalidadesOcupacion(queryParams, {
    enabled: !!selectedPlaya?.id && !isPlayaLoading
  })

  const isLoading = isPlayaLoading || isLoadingModalidades
  const hasError =
    error || result?.error || !result?.pagination || !result?.data
  const errorMessage =
    result?.error ||
    error?.message ||
    'Intente nuevamente o comuníquese con el area de sistemas'

  if (!selectedPlaya && !isPlayaLoading) {
    return (
      <div className="flex w-full grow items-center justify-center px-4 sm:px-0">
        <Alert className="w-fit">
          <AlertTriangle />
          <AlertTitle>Seleccione una playa</AlertTitle>
          <AlertDescription>
            Para ver las modalidades de ocupación, primero debe seleccionar una
            playa desde la barra lateral.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

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

  return (
    <ColumnProvider
      data={result.data!}
      pagination={result.pagination!}
      roles={roles}
    />
  )
}
