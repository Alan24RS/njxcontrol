'use client'

import { ColumnDef } from '@tanstack/react-table'

import { ActionColumnButton, StatusBadge } from '@/components/ui'
import { CellLink, SimpleHeader, SortHeader } from '@/components/ui/DataTable'
import { ROL, Role } from '@/constants/rol'

import type { TableData } from '..'

import { DeleteButton } from './DeleteButton'

type TableDataType = TableData['data'][number]

export const labels = {
  identificador: 'Identificador',
  tipoPlaza: 'Tipo de Plaza',
  estado: 'Estado',
  fechaCreacion: 'Creado',
  actions: 'Acciones'
}

const getHref = (row: TableDataType) => `/admin/plazas/${row.id}`

export default function getColumns({
  roles = []
}: {
  roles?: Role[]
} = {}): ColumnDef<TableDataType>[] {
  const isDueno = roles.includes(ROL.DUENO)

  const columns: ColumnDef<TableDataType>[] = [
    {
      accessorKey: 'identificador',
      id: 'identificador',
      meta: labels.identificador,
      enableHiding: false,
      header: () =>
        SortHeader({
          children: labels.identificador,
          id: 'identificador',
          type: 'string',
          className: 'justify-start'
        }),
      cell: ({ row }) => {
        return (
          <CellLink href={getHref(row.original)} className="justify-start">
            <p className="text-start font-medium">
              {row.original.identificador || '-'}
            </p>
          </CellLink>
        )
      }
    },
    {
      accessorKey: 'tipoPlaza',
      id: 'tipoPlaza',
      meta: labels.tipoPlaza,
      enableHiding: false,
      header: () =>
        SortHeader({
          children: labels.tipoPlaza,
          id: 'tipoPlaza',
          type: 'string',
          className: 'justify-start'
        }),
      cell: ({ row }) => (
        <CellLink href={getHref(row.original)} className="justify-start">
          <p className="text-start">
            {row.original.tipoPlaza?.nombre || 'Sin tipo'}
          </p>
        </CellLink>
      )
    },
    {
      accessorKey: 'estado',
      id: 'estado',
      meta: labels.estado,
      enableHiding: true,
      header: () =>
        SortHeader({
          children: labels.estado,
          id: 'estado',
          type: 'string',
          className: 'justify-center'
        }),
      cell: ({ row }) => (
        <CellLink href={getHref(row.original)} className="justify-center">
          <StatusBadge status={row.original.estado} />
        </CellLink>
      )
    },
    {
      accessorKey: 'fechaCreacion',
      id: 'fechaCreacion',
      meta: labels.fechaCreacion,
      enableHiding: true,
      header: () =>
        SortHeader({
          children: labels.fechaCreacion,
          id: 'fechaCreacion',
          type: 'number',
          className: 'justify-center'
        }),
      cell: ({ row }) => (
        <CellLink href={getHref(row.original)} className="justify-center">
          <p className="text-muted-foreground text-start text-sm">
            {row.original.fechaCreacion.toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}
          </p>
        </CellLink>
      )
    }
  ]

  if (isDueno) {
    columns.push({
      id: 'actions',
      accessorKey: 'actions',
      meta: labels.actions,
      header: () => <SimpleHeader>{labels.actions}</SimpleHeader>,
      enableHiding: false,
      cell: ({ row }) => {
        const { id } = row.original
        return (
          <div className="flex items-center justify-center gap-1">
            <ActionColumnButton
              icon="edit"
              tooltip="Editar plaza"
              href={`/admin/plazas/${id}`}
            />
            <DeleteButton id={id} />
          </div>
        )
      }
    })
  }

  return columns
}
