'use client'

import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui'
import { DataTableToolbar } from '@/components/ui/DataTable'
import { useUserRole } from '@/hooks/useUserRole'

import getColumns from '../TableContainer/Columns'

export default function ToolbarContainer() {
  const router = useRouter()
  const { isDueno } = useUserRole()
  const columns = getColumns()

  const availableColumns = columns
    .filter((column) => column.enableHiding !== false)
    .map((column) => ({
      id: column.id || '',
      label: (column.meta || '').toString()
    }))

  const handleShowAllAbonos = () => {
    router.push('/admin/abonos')
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <DataTableToolbar
        availableColumns={availableColumns}
        search={{
          loading: false,
          placeholder: 'Buscar por DNI, nombre o patente',
          minLength: 1
        }}
      />
      {isDueno() && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={handleShowAllAbonos}
            className="w-full sm:w-auto"
          >
            Todos los Abonados
          </Button>
        </div>
      )}
    </div>
  )
}
