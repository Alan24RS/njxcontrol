import { ColumnDef } from '@tanstack/react-table'

import { CellLink, SortHeader } from '@/components/ui/DataTable'

import type { TableData } from '..'

type TableDataType = TableData['data'][number]

const getHref = (row: TableDataType) => `/admin/abonados/${row.id}`

export const labels = {
  nombre: 'Nombre',
  apellido: 'Apellido',
  email: 'Email',
  dni: 'DNI',
  fechaAlta: 'Fecha alta',
  estado: 'Estado'
}

export default function getColumns(): ColumnDef<TableDataType>[] {
  return [
    {
      accessorKey: 'nombre',
      id: 'nombre',
      meta: labels.nombre,
      enableHiding: false,
      header: () =>
        SortHeader({
          children: labels.nombre,
          id: 'nombre',
          type: 'string',
          className: 'justify-start'
        }),
      cell: ({ row }) => (
        <CellLink href={getHref(row.original)} className="justify-start">
          <p className="text-start font-medium">{row.original.nombre}</p>
        </CellLink>
      )
    },
    {
      accessorKey: 'apellido',
      id: 'apellido',
      meta: labels.apellido,
      enableHiding: true,
      header: () =>
        SortHeader({
          children: labels.apellido,
          id: 'apellido',
          type: 'string',
          className: 'justify-start'
        }),
      cell: ({ row }) => (
        <CellLink href={getHref(row.original)} className="justify-start">
          <p className="text-start">{row.original.apellido}</p>
        </CellLink>
      )
    },
    {
      accessorKey: 'email',
      id: 'email',
      meta: labels.email,
      enableHiding: true,
      header: () =>
        SortHeader({
          children: labels.email,
          id: 'email',
          type: 'string',
          className: 'justify-start'
        }),
      cell: ({ row }) => (
        <CellLink href={getHref(row.original)} className="justify-start">
          <p className="text-start">{row.original.email ?? '-'}</p>
        </CellLink>
      )
    },
    {
      accessorKey: 'dni',
      id: 'dni',
      meta: labels.dni,
      enableHiding: true,
      header: () =>
        SortHeader({
          children: labels.dni,
          id: 'dni',
          type: 'string',
          className: 'justify-center'
        }),
      cell: ({ row }) => (
        <CellLink href={getHref(row.original)} className="justify-center">
          <p className="text-center">{row.original.dni}</p>
        </CellLink>
      )
    },
    {
      accessorKey: 'fechaAlta',
      id: 'fechaAlta',
      meta: labels.fechaAlta,
      enableHiding: true,
      header: () =>
        SortHeader({
          children: labels.fechaAlta,
          id: 'fechaAlta',
          type: 'number',
          className: 'justify-center'
        }),
      cell: ({ row }) => (
        <CellLink href={getHref(row.original)} className="justify-center">
          <p className="text-muted-foreground text-center text-sm">
            {row.original.fechaAlta
              ? row.original.fechaAlta.toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })
              : '-'}
          </p>
        </CellLink>
      )
    },
    {
      accessorKey: 'estado',
      id: 'estado',
      meta: labels.estado,
      enableHiding: false,
      header: () =>
        SortHeader({
          children: labels.estado,
          id: 'estado',
          type: 'string',
          className: 'justify-center'
        }),
      cell: ({ row }) => (
        <CellLink href={getHref(row.original)} className="justify-center">
          <p className="text-center">
            {row.original.estado ? 'Activo' : 'Inactivo'}
          </p>
        </CellLink>
      )
    }
  ]
}
