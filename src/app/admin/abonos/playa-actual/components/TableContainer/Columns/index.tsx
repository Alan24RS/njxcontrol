'use client'

import { ColumnDef } from '@tanstack/react-table'

import { ActionColumnButton, StatusBadge } from '@/components/ui'
import { CellLink, SimpleHeader } from '@/components/ui/DataTable'
import { TIPO_VEHICULO_LABEL } from '@/constants/tipoVehiculo'

import type { TableData } from '..'

import { FinalizarButton } from './FinalizarButton'

export const getHref = (row: TableDataType) =>
  `/admin/abonos/${row.playaId}/${row.plazaId}/${encodeURIComponent(row.fechaHoraInicio.toISOString())}`

type TableDataType = TableData['data'][number]

export const labels = {
  abonado: 'Abonado',
  dni: 'DNI',
  plaza: 'Plaza',
  tipoPlaza: 'Tipo Plaza',
  vehiculos: 'Vehículos',
  estado: 'Estado',
  precioMensual: 'Precio mensual',
  actions: 'Acciones'
}

export default function getColumns(): ColumnDef<TableDataType>[] {
  return [
    {
      accessorKey: 'abonado',
      id: 'abonado',
      meta: labels.abonado,
      enableHiding: false,
      header: () => <SimpleHeader>{labels.abonado}</SimpleHeader>,
      cell: ({ row }) => {
        return (
          <CellLink href={getHref(row.original)} className="justify-start">
            {row.original.abonadoNombre} {row.original.abonadoApellido}
          </CellLink>
        )
      }
    },
    {
      accessorKey: 'dni',
      id: 'dni',
      meta: labels.dni,
      enableHiding: true,
      header: () => <SimpleHeader>{labels.dni}</SimpleHeader>,
      cell: ({ row }) => (
        <CellLink href={getHref(row.original)} className="justify-center">
          {row.original.abonadoDni}
        </CellLink>
      )
    },
    {
      accessorKey: 'plaza',
      id: 'plaza',
      meta: labels.plaza,
      enableHiding: true,
      header: () => <SimpleHeader>{labels.plaza}</SimpleHeader>,
      cell: ({ row }) => (
        <CellLink href={getHref(row.original)} className="justify-center">
          {row.original.plazaIdentificador}
        </CellLink>
      )
    },
    {
      accessorKey: 'tipoPlaza',
      id: 'tipoPlaza',
      meta: labels.tipoPlaza,
      enableHiding: true,
      header: () => <SimpleHeader>{labels.tipoPlaza}</SimpleHeader>,
      cell: ({ row }) => (
        <CellLink href={getHref(row.original)} className="justify-center">
          {row.original.tipoPlazaNombre}
        </CellLink>
      )
    },
    {
      accessorKey: 'vehiculos',
      id: 'vehiculos',
      meta: labels.vehiculos,
      enableHiding: true,
      header: () => <SimpleHeader>{labels.vehiculos}</SimpleHeader>,
      cell: ({ row }) => (
        <CellLink
          href={getHref(row.original)}
          className="flex-wrap justify-center"
        >
          {row.original.vehiculos.map((v) => (
            <StatusBadge
              key={v.patente}
              status={`${v.patente} (${TIPO_VEHICULO_LABEL[v.tipoVehiculo]})`}
              className="w-fit text-xs"
            />
          ))}
        </CellLink>
      )
    },
    {
      accessorKey: 'estado',
      id: 'estado',
      meta: labels.estado,
      enableHiding: false,
      header: () => (
        <SimpleHeader className="justify-center">{labels.estado}</SimpleHeader>
      ),
      cell: ({ row }) => (
        <CellLink href={getHref(row.original)} className="justify-center">
          <StatusBadge
            status={row.original.tieneDeuda ? 'Con deuda' : 'Al día'}
          />
        </CellLink>
      )
    },
    {
      accessorKey: 'precioMensual',
      id: 'precioMensual',
      meta: labels.precioMensual,
      enableHiding: true,
      header: () => (
        <SimpleHeader className="justify-end">
          {labels.precioMensual}
        </SimpleHeader>
      ),
      cell: ({ row }) => (
        <CellLink href={getHref(row.original)} className="justify-end">
          ${row.original.precioMensual.toLocaleString()}
        </CellLink>
      )
    },
    {
      id: 'actions',
      accessorKey: 'actions',
      meta: labels.actions,
      header: () => (
        <SimpleHeader className="justify-end">{labels.actions}</SimpleHeader>
      ),
      enableHiding: false,
      cell: ({ row }) => {
        const boletasUrl = `/admin/abonos/${row.original.playaId}/${row.original.plazaId}/${encodeURIComponent(row.original.fechaHoraInicio.toISOString())}/boletas`

        return (
          <div className="flex items-center justify-end gap-1">
            <ActionColumnButton
              icon="view"
              tooltip="Ver boletas"
              href={boletasUrl}
            />
            <FinalizarButton
              playaId={row.original.playaId}
              plazaId={row.original.plazaId}
              fechaHoraInicio={row.original.fechaHoraInicio.toISOString()}
            />
          </div>
        )
      }
    }
  ]
}
