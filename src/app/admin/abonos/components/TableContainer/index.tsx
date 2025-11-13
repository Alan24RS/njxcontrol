'use client'

import { Spinner } from '@/components/ui'
import { DataTable } from '@/components/ui/DataTable'
import { MessageCard } from '@/components/ui/MessageCard'
import { useGetAbonosVigentes } from '@/hooks/queries/abonos/getAbonosVigentes'
import { useUserRole } from '@/hooks/useUserRole'
import type { AbonoVigente } from '@/services/abonos'
import { useSelectedPlaya } from '@/stores/useSelectedPlaya'

import ToolbarContainer from '../ToolbarContainer'

import getColumns from './Columns'

export type TableData = {
  data: AbonoVigente[]
}

export default function TableContainer() {
  const { selectedPlaya, isLoading: playaLoading } = useSelectedPlaya()
  const { isDueno, isLoading: roleLoading } = useUserRole()

  const isOwner = isDueno()
  const playaIdToFilter = isOwner ? undefined : selectedPlaya?.id

  const {
    data: response,
    error,
    isLoading: abonosLoading,
    isError
  } = useGetAbonosVigentes(playaIdToFilter)

  const isLoading = playaLoading || abonosLoading || roleLoading

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
            Debes seleccionar una playa para ver los abonos
          </p>
        </div>
      </div>
    )
  }

  if (isError || error || response?.error) {
    return <MessageCard />
  }

  const abonos = response?.data || []

  const columns = getColumns()

  return (
    <>
      <ToolbarContainer />
      <DataTable
        data={abonos}
        columns={columns}
        pagination={{
          total: abonos.length,
          lastPage: 1,
          currentPage: 1,
          pageSize: abonos.length
        }}
      />
    </>
  )
}
