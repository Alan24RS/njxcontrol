'use client'

import { useState, useTransition } from 'react'

import { useQueryClient } from '@tanstack/react-query'

import { deleteTipoPlazaAction } from '@/app/admin/tipos-plaza/actions'
import { ActionColumnButton } from '@/components/ui'
import { AlertDialog } from '@/components/ui/alert-dialog'
import EnhancedDeleteDialog from '@/components/ui/DeleteDialog/Enhanced'
import { useSelectedPlaya } from '@/stores'

export const DeleteButton = ({ id }: { id: number }) => {
  const [showDialog, setShowDialog] = useState(false)
  const [_isPending, startTransition] = useTransition()
  const { selectedPlaya } = useSelectedPlaya()
  const queryClient = useQueryClient()

  const handleDelete = async () => {
    return new Promise<{ success: boolean; error?: string; message?: string }>(
      (resolve) => {
        startTransition(async () => {
          try {
            const result = await deleteTipoPlazaAction(id, selectedPlaya!.id)

            if (result.success) {
              // Invalidar las queries de tipos de plaza para refrescar la tabla
              queryClient.invalidateQueries({
                queryKey: ['tipos-plaza']
              })
              setShowDialog(false)
              resolve({
                success: true,
                message: result.message
              })
            } else {
              resolve({
                success: false,
                error: result.error || 'Error al eliminar el tipo de plaza'
              })
            }
          } catch {
            resolve({
              success: false,
              error: 'Error inesperado al eliminar el tipo de plaza'
            })
          }
        })
      }
    )
  }

  return (
    <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
      <ActionColumnButton
        icon="delete"
        tooltip="Eliminar tipo de plaza"
        onClick={() => setShowDialog(true)}
      />
      <EnhancedDeleteDialog
        onConfirm={handleDelete}
        title="Eliminar tipo de plaza"
        description="¿Estás seguro de eliminar este tipo de plaza? Si está siendo usado en tarifas o plazas, será marcado como eliminado. Si no está siendo usado, será eliminado completamente junto con sus características."
        successMessage="Tipo de plaza eliminado correctamente"
        errorMessage="Error al eliminar el tipo de plaza"
      />
    </AlertDialog>
  )
}
