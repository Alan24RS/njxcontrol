'use client'

import { ColumnDef } from '@tanstack/react-table'

import { ActionColumnButton, Badge } from '@/components/ui'
import { CellLink, SimpleHeader, SortHeader } from '@/components/ui/DataTable'
import { MODALIDAD_OCUPACION_LABEL } from '@/constants/modalidadOcupacion'
import { ROL, Role } from '@/constants/rol'
import { TIPO_VEHICULO_LABEL } from '@/constants/tipoVehiculo'

import type { TableData } from '..'

import { DeleteButton } from './DeleteButton'

type TableDataType = TableData['data'][number]

const getHref = (row: TableDataType) =>
  `/admin/tarifas/${row.playaId}/${row.tipoPlazaId}/${row.modalidadOcupacion}/${row.tipoVehiculo}`

export const labels = {
  tipoPlaza: 'Tipo de Plaza',
  modalidadOcupacion: 'Modalidad',
  tipoVehiculo: 'Vehículo',
  precioBase: 'Precio Base',
  fechaCreacion: 'Creado',
  actions: 'Acciones'
}

export default function getColumns({
  roles = []
}: {
  roles?: Role[]
} = {}): ColumnDef<TableDataType>[] {
  const isDueno = roles.includes(ROL.DUENO)

  const columns: ColumnDef<TableDataType>[] = [
    {
      id: 'tipoPlaza.nombre',
      accessorKey: 'tipoPlaza.nombre',
      meta: labels.tipoPlaza,
      enableHiding: false,
      header: () =>
        SortHeader({
          children: labels.tipoPlaza,
          id: 'tipoPlaza',
          type: 'string',
          className: 'justify-start'
        }),
      cell: ({ row }) => {
        const tarifa = row.original

        return (
          <CellLink href={getHref(tarifa)} className="justify-start">
            <div className="flex flex-col items-start">
              <p className="font-medium">{tarifa.tipoPlaza.nombre}</p>
              {tarifa.tipoPlaza.descripcion && (
                <p className="text-muted-foreground text-sm">
                  {tarifa.tipoPlaza.descripcion}
                </p>
              )}
            </div>
          </CellLink>
        )
      }
    },
    {
      id: 'modalidadOcupacion',
      accessorKey: 'modalidadOcupacion',
      meta: labels.modalidadOcupacion,
      enableHiding: true,
      header: () =>
        SortHeader({
          children: labels.modalidadOcupacion,
          id: 'modalidadOcupacion',
          type: 'string',
          className: 'justify-center'
        }),
      cell: ({ row }) => (
        <CellLink href={getHref(row.original)} className="justify-center">
          <Badge variant="outline">
            {
              MODALIDAD_OCUPACION_LABEL[
                row.original
                  .modalidadOcupacion as keyof typeof MODALIDAD_OCUPACION_LABEL
              ]
            }
          </Badge>
        </CellLink>
      )
    },
    {
      id: 'tipoVehiculo',
      accessorKey: 'tipoVehiculo',
      meta: labels.tipoVehiculo,
      enableHiding: true,
      header: () =>
        SortHeader({
          children: labels.tipoVehiculo,
          id: 'tipoVehiculo',
          type: 'string',
          className: 'justify-center'
        }),
      cell: ({ row }) => (
        <CellLink href={getHref(row.original)} className="justify-center">
          <Badge variant="secondary">
            {
              TIPO_VEHICULO_LABEL[
                row.original.tipoVehiculo as keyof typeof TIPO_VEHICULO_LABEL
              ]
            }
          </Badge>
        </CellLink>
      )
    },
    {
      id: 'precioBase',
      accessorKey: 'precioBase',
      meta: labels.precioBase,
      enableHiding: true,
      header: () =>
        SortHeader({
          children: labels.precioBase,
          id: 'precioBase',
          type: 'number',
          className: 'justify-end'
        }),
      cell: ({ row }) => (
        <CellLink href={getHref(row.original)} className="justify-end">
          <p className="font-mono font-medium">
            ${row.original.precioBase.toFixed(2)}
          </p>
        </CellLink>
      )
    },
    {
      id: 'fechaCreacion',
      accessorKey: 'fechaCreacion',
      meta: labels.fechaCreacion,
      enableHiding: true,
      header: () =>
        SortHeader({
          children: labels.fechaCreacion,
          id: 'fechaCreacion',
          className: 'justify-center'
        }),
      cell: ({ row }) => (
        <CellLink href={getHref(row.original)} className="justify-center">
          <p className="text-muted-foreground text-sm">
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
        const tarifa = row.original
        const href = `/admin/tarifas/${tarifa.playaId}/${tarifa.tipoPlazaId}/${tarifa.modalidadOcupacion}/${tarifa.tipoVehiculo}`
        return (
          <div className="flex items-center justify-center gap-1">
            <ActionColumnButton
              icon="edit"
              tooltip="Editar tarifa"
              href={href}
            />
            <DeleteButton
              playaId={tarifa.playaId}
              tipoPlazaId={tarifa.tipoPlazaId}
              modalidadOcupacion={tarifa.modalidadOcupacion}
              tipoVehiculo={tarifa.tipoVehiculo}
            />
          </div>
        )
      }
    })
  }

  return columns
}
