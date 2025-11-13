'use client'

import { type ColumnDef } from '@tanstack/react-table'

import {
  Badge,
  CellLink,
  SimpleHeader,
  SortHeader,
  StatusBadge
} from '@/components/ui'
import { formatDate } from '@/utils/formatUtils'

import type { TableData } from '..'

import PlayeroActions from './PlayeroActions'

type TableDataType = TableData['data'][number]

const labels = {
  nombre: 'Nombre',
  email: 'Email',
  telefono: 'Teléfono',
  playasAsignadas: 'Playas asignadas',
  fechaAlta: 'Fecha de alta',
  estado: 'Estado',
  actions: 'Acciones'
}

const getHref = (row: TableDataType) => {
  // Para invitaciones pendientes, no hay link ya que no tienen playeroId
  if (row.tipoRegistro === 'INVITACION_PENDIENTE' || !row.playeroId) {
    return '#'
  }
  return `/admin/playeros/${row.playeroId}`
}

export default function getColumns(): ColumnDef<TableDataType>[] {
  return [
    {
      accessorKey: 'usuario.nombre',
      id: 'nombre',
      meta: labels.nombre,
      enableHiding: true,
      header: () =>
        SortHeader({
          children: labels.nombre,
          id: 'nombre',
          type: 'string',
          className: 'justify-start'
        }),
      cell: ({ row }) => {
        const nombre = row.original.usuario.nombre
        const href = getHref(row.original)
        const isPendingInvitation =
          row.original.tipoRegistro === 'INVITACION_PENDIENTE'

        if (isPendingInvitation) {
          return (
            <CellLink href={href} className="justify-start">
              <p className="text-start font-medium">{nombre || 'Sin nombre'}</p>
            </CellLink>
          )
        }

        return (
          <CellLink href={href} className="justify-start">
            <p className="text-start font-medium">{nombre || 'Sin nombre'}</p>
          </CellLink>
        )
      }
    },
    {
      accessorKey: 'usuario.email',
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
      cell: ({ row }) => {
        const email = row.original.usuario.email
        const href = getHref(row.original)
        const isPendingInvitation =
          row.original.tipoRegistro === 'INVITACION_PENDIENTE'

        if (isPendingInvitation) {
          return (
            <CellLink href={href} className="justify-start">
              <p className="text-start font-medium">{email}</p>
            </CellLink>
          )
        }

        return (
          <CellLink href={href} className="justify-start">
            <p className="text-start font-medium">{email}</p>
          </CellLink>
        )
      }
    },
    {
      accessorKey: 'usuario.telefono',
      id: 'telefono',
      meta: labels.telefono,
      enableHiding: true,
      header: () =>
        SortHeader({
          children: labels.telefono,
          id: 'telefono',
          type: 'string',
          className: 'justify-start'
        }),
      cell: ({ row }) => {
        const telefono = row.original.usuario.telefono
        const href = getHref(row.original)
        const isPendingInvitation =
          row.original.tipoRegistro === 'INVITACION_PENDIENTE'

        if (isPendingInvitation) {
          return (
            <CellLink href={href} className="justify-start">
              <p className="text-start font-medium">{telefono || '-'}</p>
            </CellLink>
          )
        }

        return (
          <CellLink href={href} className="justify-start">
            <p className="text-start font-medium">{telefono || '-'}</p>
          </CellLink>
        )
      }
    },
    {
      accessorKey: 'playasAsignadas',
      id: 'playasAsignadas',
      meta: labels.playasAsignadas,
      enableHiding: true,
      header: () => (
        <SimpleHeader className="justify-start">
          {labels.playasAsignadas}
        </SimpleHeader>
      ),
      cell: ({ row }) => {
        const playas = (row.original.playasAsignadas || []).filter(
          (p: any) => p == null || p.fecha_baja == null
        )

        return (
          <CellLink href={getHref(row.original)} className="justify-start">
            <div className="flex gap-2">
              {playas.length > 0 ? (
                playas.map((playa: any) => (
                  <Badge key={playa.playa_id} variant={'secondary'}>
                    {playa.nombre || playa.direccion || 'Sin nombre'}
                  </Badge>
                ))
              ) : (
                <span className="text-muted-foreground text-xs">
                  Sin playas
                </span>
              )}
            </div>
          </CellLink>
        )
      }
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
          className: 'justify-start'
        }),
      cell: ({ row }) => {
        const fecha = row.original.fechaAlta
        const href = getHref(row.original)
        const isPendingInvitation =
          row.original.tipoRegistro === 'INVITACION_PENDIENTE'

        if (isPendingInvitation) {
          return (
            <CellLink href={href} className="justify-start">
              <p className="text-start font-medium">
                {fecha ? formatDate(fecha) : 'Invitación enviada'}
              </p>
            </CellLink>
          )
        }

        return (
          <CellLink href={href} className="justify-start">
            <p className="text-start font-medium">
              {fecha ? formatDate(fecha) : 'Sin fecha'}
            </p>
          </CellLink>
        )
      }
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
      cell: ({ row }) => {
        const estado = row.original.estado
        const href = getHref(row.original)
        const isPendingInvitation =
          row.original.tipoRegistro === 'INVITACION_PENDIENTE'

        if (isPendingInvitation) {
          return (
            <div className="flex justify-center">
              <StatusBadge status={estado} />
            </div>
          )
        }

        return (
          <CellLink href={href} className="justify-center">
            <StatusBadge status={estado} />
          </CellLink>
        )
      }
    },
    {
      id: 'actions',
      accessorKey: 'actions',
      meta: labels.actions,
      enableHiding: false,
      header: () => <SimpleHeader>{labels.actions}</SimpleHeader>,
      cell: ({ row }) => {
        return <PlayeroActions playero={row.original} />
      }
    }
  ]
}
