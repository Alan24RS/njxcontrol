'use client'

import { DataTableToolbar } from '@/components/ui/DataTable'
import { useGetTurnos } from '@/hooks/queries/turnos/useGetTurnos'
import { useSelectedPlaya } from '@/stores/useSelectedPlaya'

import { PageParams } from '../../page'
import { getColumns } from '../TableContainer/Columns'

export default function ToolbarContainer({
  params
}: {
  params: Partial<PageParams>
}) {
  const { selectedPlaya, isLoading: playaLoading } = useSelectedPlaya()

  const queryParams = {
    playaId: selectedPlaya?.id || '',
    fromDate: params.fromDate,
    toDate: params.toDate
  }

  const { data: response, isLoading: isLoadingTurnos } = useGetTurnos(
    queryParams,
    {
      enabled: !playaLoading && !!selectedPlaya?.id
    }
  )

  const columns = getColumns()

  const availableColumns = columns
    .filter((column) => column.enableHiding !== false)
    .map((column) => ({
      id: column.id || '',
      label: (column.meta as string) || column.header?.toString() || ''
    }))

  return (
    <DataTableToolbar
      filters={{
        loading: isLoadingTurnos || playaLoading,
        data: response?.filters
      }}
      availableColumns={availableColumns}
      search={{
        loading: playaLoading,
        placeholder: 'Buscar turnos',
        minLength: 1
      }}
    />
  )
}
