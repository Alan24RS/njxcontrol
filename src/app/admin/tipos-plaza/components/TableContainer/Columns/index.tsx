'use client'

import { ColumnDef } from '@tanstack/react-table'

import { ActionColumnButton, Badge } from '@/components/ui'
import { CellLink, SimpleHeader, SortHeader } from '@/components/ui/DataTable'
import { ROL, Role } from '@/constants/rol'

import type { TableData } from '..'

import { DeleteButton } from './DeleteButton'

type TableDataType = TableData['data'][number]

export const labels = {
  name: 'Nombre',
  description: 'Descripción',
  caracteristicas: 'Características',
  fechaCreacion: 'Creado',
  actions: 'Acciones'
}

const getHref = (row: TableDataType) => `/admin/tipos-plaza/${row.id}`

export default function getColumns({
  roles = []
}: {
  roles?: Role[]
} = {}): ColumnDef<TableDataType>[] {
  const isDueno = roles.includes(ROL.DUENO)

  const columns: ColumnDef<TableDataType>[] = [
    {
      accessorKey: 'nombre',
      id: 'nombre',
      meta: labels.name,
      enableHiding: false,
      header: () =>
        SortHeader({
          children: labels.name,
          id: 'nombre',
          type: 'string',
          className: 'justify-start'
        }),
      cell: ({ row }) => {
        return (
          <CellLink href={getHref(row.original)} className="justify-start">
            <p className="text-start font-medium">{row.original.nombre}</p>
          </CellLink>
        )
      }
    },
    {
      accessorKey: 'descripcion',
      id: 'descripcion',
      meta: labels.description,
      enableHiding: true,
      header: () =>
        SortHeader({
          children: labels.description,
          id: 'descripcion',
          type: 'string',
          className: 'justify-start'
        }),
      cell: ({ row }) => (
        <CellLink href={getHref(row.original)} className="justify-start">
          <p className="text-muted-foreground text-start">
            {row.original.descripcion || '-'}
          </p>
        </CellLink>
      )
    },
    {
      accessorKey: 'caracteristicas',
      id: 'caracteristicas',
      meta: labels.caracteristicas,
      enableHiding: true,
      header: () => (
        <SimpleHeader className="justify-start">
          {labels.caracteristicas}
        </SimpleHeader>
      ),
      cell: ({ row }) => (
        <CellLink href={getHref(row.original)} className="justify-start">
          <div className="flex flex-wrap gap-1">
            {row.original.caracteristicas.length > 0 ? (
              row.original.caracteristicas.map((caracteristica) => (
                <Badge key={caracteristica.id} variant="secondary">
                  {caracteristica.nombre}
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground text-xs">
                Sin características
              </span>
            )}
          </div>
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
      meta: labels.actions,
      header: () => <SimpleHeader>{labels.actions}</SimpleHeader>,
      enableHiding: false,
      cell: ({ row }) => {
        const { id } = row.original
        return (
          <div className="flex items-center justify-center gap-1">
            <ActionColumnButton
              icon="edit"
              tooltip="Editar tipo de plaza"
              href={`/admin/tipos-plaza/${id}`}
            />
            <DeleteButton id={id} />
          </div>
        )
      }
    })
  }

  return columns
}
