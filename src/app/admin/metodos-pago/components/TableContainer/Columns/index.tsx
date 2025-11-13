'use client'

import { useState } from 'react'

import { ColumnDef } from '@tanstack/react-table'

import { ActionColumnButton, StatusBadge, StatusModal } from '@/components/ui'
import { SimpleHeader, SortHeader } from '@/components/ui/DataTable'
import {
  ESTADO_METODO_PAGO,
  ESTADO_METODO_PAGO_LABEL,
  METODO_PAGO_LABEL
} from '@/constants/metodoPago'
import { ROL, Role } from '@/constants/rol'
import { useUpdateMetodoPagoEstado } from '@/hooks/mutations/metodos-pago'
import { useSelectedPlaya } from '@/stores/useSelectedPlaya'

import type { TableData } from '..'

type TableDataType = TableData['data'][number]

const ActionsCell = ({ row }: { row: { original: TableDataType } }) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { selectedPlaya } = useSelectedPlaya()
  const updateEstadoMutation = useUpdateMetodoPagoEstado()

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedPlaya?.id) {
      return { success: false, message: 'No hay playa seleccionada' }
    }

    try {
      await updateEstadoMutation.mutateAsync({
        playaId: selectedPlaya.id,
        metodoPago: row.original.metodoPago,
        estado: newStatus as 'ACTIVO' | 'SUSPENDIDO'
      })

      return { success: true, message: 'Estado actualizado correctamente' }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Error inesperado al actualizar el estado'
      return { success: false, message: errorMessage }
    }
  }

  return (
    <>
      <div className="flex h-full w-full items-center justify-center">
        <ActionColumnButton
          icon="edit"
          tooltip="Editar estado"
          onClick={() => setIsModalOpen(true)}
        />
      </div>

      <StatusModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        title="Cambiar estado"
        description="Seleccione el nuevo estado para este método de pago."
        currentStatus={row.original.estado}
        options={Object.values(ESTADO_METODO_PAGO).map((opt) => ({
          value: opt,
          label: ESTADO_METODO_PAGO_LABEL[opt]
        }))}
        onStatusChange={handleStatusChange}
      />
    </>
  )
}

export const labels = {
  nombre: 'Método de pago',
  estado: 'Estado',
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
      accessorKey: 'nombre',
      meta: labels.nombre,
      enableHiding: false,
      header: () =>
        SortHeader({
          children: labels.nombre,
          id: 'metodo_pago',
          type: 'string',
          className: 'justify-start'
        }),
      cell: ({ row }) => {
        const metodoPago = row.original.metodoPago
        return (
          <div className="flex h-full w-full items-center justify-start">
            <p className="text-start font-medium">
              {METODO_PAGO_LABEL[metodoPago] || metodoPago}
            </p>
          </div>
        )
      }
    },
    {
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
      cell: ({ row }) => {
        return (
          <div className="flex h-full w-full items-center justify-center">
            <StatusBadge status={row.original.estado} />
          </div>
        )
      }
    },
    {
      accessorKey: 'fechaCreacion',
      meta: labels.fechaCreacion,
      enableHiding: true,
      header: () =>
        SortHeader({
          children: labels.fechaCreacion,
          id: 'fecha_creacion',
          className: 'justify-center'
        }),
      cell: ({ row }) => (
        <div className="flex h-full w-full items-center justify-center">
          <p className="text-muted-foreground text-start text-sm">
            {row.original.fechaCreacion.toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}
          </p>
        </div>
      )
    }
  ]

  if (isDueno) {
    columns.push({
      id: 'actions',
      meta: labels.actions,
      enableHiding: false,
      header: () => <SimpleHeader>{labels.actions}</SimpleHeader>,
      cell: ActionsCell
    })
  }

  return columns
}
