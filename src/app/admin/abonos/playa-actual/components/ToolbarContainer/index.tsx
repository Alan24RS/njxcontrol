'use client'

import { DataTableToolbar } from '@/components/ui/DataTable'

import getColumns from '../TableContainer/Columns'

export default function ToolbarContainer() {
  const columns = getColumns()

  const availableColumns = columns
    .filter((column) => column.enableHiding !== false)
    .map((column) => ({
      id: column.id || '',
      label: (column.meta || '').toString()
    }))

  return (
    <DataTableToolbar
      availableColumns={availableColumns}
      search={{
        loading: false,
        placeholder: 'Buscar por DNI, nombre o patente',
        minLength: 1
      }}
    />
  )
}
