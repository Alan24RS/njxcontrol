'use client'

import { useState, useTransition } from 'react'

import { useQueryClient } from '@tanstack/react-query'

import { deleteTarifaAction } from '@/app/admin/tarifas/actions'
import { ActionColumnButton } from '@/components/ui'
import { AlertDialog } from '@/components/ui/alert-dialog'
import EnhancedDeleteDialog from '@/components/ui/DeleteDialog/Enhanced'

export type DeleteButtonProps = {
  playaId: string
  tipoPlazaId: number
  modalidadOcupacion: string
  tipoVehiculo: string
}

export const DeleteButton = ({
  playaId,
  tipoPlazaId,
  modalidadOcupacion,
  tipoVehiculo
}: DeleteButtonProps) => {
  const [showDialog, setShowDialog] = useState(false)
  const [_isPending, startTransition] = useTransition()
  const queryClient = useQueryClient()

  const handleDelete = async () => {
    return new Promise<{ success: boolean; error?: string }>((resolve) => {
      startTransition(async () => {
        try {
          const result = await deleteTarifaAction({
            playaId,
            tipoPlazaId,
            modalidadOcupacion,
            tipoVehiculo
          })

          if (result.success) {
            // Invalidar las queries de tarifas para refrescar la tabla
            queryClient.invalidateQueries({
              queryKey: ['tarifas']
            })
            setShowDialog(false)
            resolve({ success: true })
          } else {
            resolve({
              success: false,
              error: result.error || 'Error al eliminar la tarifa'
            })
          }
        } catch {
          resolve({
            success: false,
            error: 'Error inesperado al eliminar la tarifa'
          })
        }
      })
    })
  }

  return (
    <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
      <ActionColumnButton
        icon="delete"
        tooltip="Eliminar tarifa"
        onClick={() => setShowDialog(true)}
      />
      <EnhancedDeleteDialog
        onConfirm={handleDelete}
        title="Eliminar tarifa"
        description="¿Estás seguro de eliminar esta tarifa? Esta acción no se puede deshacer."
        successMessage="Tarifa eliminada correctamente"
        errorMessage="Error al eliminar la tarifa"
      />
    </AlertDialog>
  )
}
