'use client'

import { useState, useTransition } from 'react'

import { useQueryClient } from '@tanstack/react-query'

import { deletePlazaAction } from '@/app/admin/plazas/actions'
import { ActionColumnButton } from '@/components/ui'
import { AlertDialog } from '@/components/ui/alert-dialog'
import EnhancedDeleteDialog from '@/components/ui/DeleteDialog/Enhanced'

export const DeleteButton = ({ id }: { id: string }) => {
  const [showDialog, setShowDialog] = useState(false)
  const [_isPending, startTransition] = useTransition()
  const queryClient = useQueryClient()

  const handleDelete = async () => {
    return new Promise<{ success: boolean; error?: string }>((resolve) => {
      startTransition(async () => {
        try {
          const result = await deletePlazaAction(id)

          if (result.success) {
            // Invalidar las queries de plazas para refrescar la tabla
            queryClient.invalidateQueries({
              queryKey: ['plazas']
            })
            setShowDialog(false)
            resolve({ success: true })
          } else {
            resolve({
              success: false,
              error: result.error || 'Error al eliminar la plaza'
            })
          }
        } catch {
          resolve({
            success: false,
            error: 'Error inesperado al eliminar la plaza'
          })
        }
      })
    })
  }

  return (
    <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
      <ActionColumnButton
        icon="delete"
        tooltip="Eliminar plaza"
        onClick={() => setShowDialog(true)}
      />
      <EnhancedDeleteDialog
        onConfirm={handleDelete}
        title="Eliminar plaza"
        description="¿Estás seguro de eliminar esta plaza? Si tiene ocupaciones, turnos o reservas asociadas se realizará una baja lógica, de lo contrario será eliminada completamente."
        successMessage="Plaza eliminada correctamente"
        errorMessage="Error al eliminar la plaza"
      />
    </AlertDialog>
  )
}
