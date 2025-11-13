'use client'

import { ColumnDef } from '@tanstack/react-table'

import { ActionColumnButton, StatusBadge } from '@/components/ui'
import { CellLink, SimpleHeader, SortHeader } from '@/components/ui/DataTable'

import type { TableData } from '..'

import { DeleteButton } from './DeleteButton'

type TableDataType = TableData['data'][number]

const labels = {
  name: 'Nombre',
  address: 'Dirección',
  description: 'Descripción',
  ciudad: 'Ciudad',
  estado: 'Estado',
  actions: 'Acciones'
}

const getHref = (row: TableDataType) => `/admin/playas/${row.id}`

export default function getColumns(): ColumnDef<TableDataType>[] {
  return [
    {
      id: 'name',
      accessorKey: 'nombre',
      meta: labels.name,
      enableHiding: false,
      header: () =>
        SortHeader({
          children: labels.name,
          id: 'name',
          type: 'string',
          className: 'justify-start'
        }),
      cell: ({ row }) => {
        return (
          <CellLink href={getHref(row.original)} className="justify-start">
            <p className="text-start">{row.original.nombre || '-'}</p>
          </CellLink>
        )
      }
    },
    {
      id: 'address',
      accessorKey: 'direccion',
      meta: labels.address,
      enableHiding: false,
      header: () =>
        SortHeader({
          children: labels.address,
          id: 'address',
          type: 'string',
          className: 'justify-start'
        }),
      cell: ({ row }) => {
        return (
          <CellLink href={getHref(row.original)} className="justify-start">
            <p className="text-start">{row.original.direccion}</p>
          </CellLink>
        )
      }
    },
    {
      id: 'description',
      accessorKey: 'descripcion',
      meta: labels.description,
      enableHiding: true,
      header: () =>
        SortHeader({
          children: labels.description,
          id: 'description',
          type: 'string',
          className: 'justify-start min-w-64'
        }),
      cell: ({ row }) => (
        <CellLink
          href={getHref(row.original)}
          className="min-w-64 justify-start"
        >
          <p className="line-clamp-2 text-start text-wrap">
            {row.original.descripcion || '-'}
          </p>
        </CellLink>
      )
    },
    {
      id: 'ciudad',
      accessorKey: 'ciudadNombre',
      meta: labels.ciudad,
      enableHiding: true,
      header: () =>
        SortHeader({
          children: labels.ciudad,
          id: 'ciudad',
          type: 'string',
          className: 'justify-start'
        }),
      cell: ({ row }) => (
        <CellLink href={getHref(row.original)} className="justify-start">
          <p className="text-start">
            {row.original.ciudadNombre
              ? `${row.original.ciudadNombre}, ${row.original.ciudadProvincia}`
              : 'Sin ciudad'}
          </p>
        </CellLink>
      )
    },
    {
      id: 'estado',
      accessorKey: 'estado',
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
              tooltip="Editar playa"
              href={`/admin/playas/${id}`}
            />
            <DeleteButton id={id} />
          </div>
        )
      }
    }
  ]
}
