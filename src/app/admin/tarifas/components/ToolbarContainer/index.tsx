'use client'

import { DataTableToolbar } from '@/components/ui/DataTable'
import { useGetTarifas } from '@/hooks/queries/tarifas/getTarifas'
import { useSelectedPlaya } from '@/stores'

import { PageParams } from '../../page'
import getColumns from '../TableContainer/Columns'

export default function ToolbarContainer({
  params
}: {
  params: Partial<PageParams>
}) {
  const { selectedPlaya, isLoading: playaLoading } = useSelectedPlaya()

  const queryParams = {
    ...params,
    playaId: selectedPlaya?.id || '',
    includeFilters: true
  }

  const { data: response, isLoading: isLoadingTarifas } = useGetTarifas(
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
      label: (column.meta || '').toString()
    }))

  return (
    <DataTableToolbar
      filters={{
        loading: isLoadingTarifas || playaLoading,
        data: response?.filters
      }}
      availableColumns={availableColumns}
      search={{
        loading: playaLoading,
        placeholder: 'Buscar tarifas',
        minLength: 1
      }}
    />
  )
}
