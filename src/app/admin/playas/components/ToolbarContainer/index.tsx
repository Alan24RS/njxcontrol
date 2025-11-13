'use client'

import { DataTableToolbar } from '@/components/ui/DataTable'
import { useGetPlayas } from '@/hooks/queries/playas/getPlayas'

import { PageParams } from '../../page'
import getColumns from '../TableContainer/Columns'

export default function ToolbarContainer({
  params
}: {
  params: Partial<PageParams>
}) {
  const { data: response, isLoading } = useGetPlayas({
    ...params,
    includeFilters: true
  })

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
        loading: isLoading,
        data: response?.filters
      }}
      availableColumns={availableColumns}
      search={{
        loading: isLoading,
        placeholder: 'Buscar por nombre, dirección o descripción',
        minLength: 1
      }}
    />
  )
}
