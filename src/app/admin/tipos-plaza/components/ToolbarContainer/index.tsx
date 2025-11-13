'use client'

import { DataTableToolbar } from '@/components/ui/DataTable'
import { useGetTiposPlaza } from '@/hooks/queries/tipos-plaza/getTiposPlaza'
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
    playaId: selectedPlaya?.id,
    includeFilters: true
  }

  const { data: response, isLoading: isLoadingTiposPlaza } = useGetTiposPlaza(
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
        loading: isLoadingTiposPlaza || playaLoading,
        data: response?.filters
      }}
      search={{
        loading: playaLoading,
        placeholder: 'Buscar por nombre o descripción',
        minLength: 1
      }}
      availableColumns={availableColumns}
    />
  )
}
