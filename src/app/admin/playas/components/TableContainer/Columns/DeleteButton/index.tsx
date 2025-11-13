'use client'

import { useState, useTransition } from 'react'

import { deletePlayaAction } from '@/app/admin/playas/actions'
import { ActionColumnButton } from '@/components/ui'
import { AlertDialog } from '@/components/ui/alert-dialog'
import EnhancedDeleteDialog from '@/components/ui/DeleteDialog/Enhanced'
import { useSelectedPlaya } from '@/stores'

export const DeleteButton = ({ id }: { id: string }) => {
  const [showDialog, setShowDialog] = useState(false)
  const [_isPending, startTransition] = useTransition()
  const { selectedPlaya, clearSelectedPlaya } = useSelectedPlaya()

  const handleDelete = async () => {
    return new Promise<{ success: boolean; error?: string }>((resolve) => {
      startTransition(async () => {
        try {
          const result = await deletePlayaAction(id)

          if (result.success) {
            // Verificar si la playa eliminada es la que está seleccionada
            if (selectedPlaya?.id === id) {
              clearSelectedPlaya()
            }

            setShowDialog(false)
            resolve({ success: true })
          } else {
            resolve({
              success: false,
              error: result.error || 'Error al eliminar la playa'
            })
          }
        } catch {
          resolve({
            success: false,
            error: 'Error inesperado al eliminar la playa'
          })
        }
      })
    })
  }

  return (
    <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
      <ActionColumnButton
        icon="delete"
        tooltip="Eliminar playa"
        onClick={() => setShowDialog(true)}
        variant="ghost"
        className="text-destructive hover:text-destructive"
      />
      <EnhancedDeleteDialog
        onConfirm={handleDelete}
        title="Eliminar playa"
        description="¿Estás seguro de eliminar esta playa? Esta acción no se puede deshacer."
        successMessage="Playa eliminada correctamente"
        errorMessage="Error al eliminar la playa"
      />
    </AlertDialog>
  )
}
