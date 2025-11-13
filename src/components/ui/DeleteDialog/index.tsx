'use client'

import { useState } from 'react'

import { toast } from 'sonner'

import {
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

type DeleteDialogProps = {
  title?: string
  description?: string
  onConfirm: () => Promise<{ success: boolean; error?: string }>
  onSuccess?: () => void
  successMessage?: string
  errorMessage?: string
}

export default function DeleteDialog({
  title = 'Eliminar',
  description = 'Esta acción no se puede deshacer.',
  onConfirm,
  onSuccess,
  successMessage = 'Elemento eliminado correctamente',
  errorMessage = 'Error al eliminar el elemento'
}: DeleteDialogProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleConfirm = async () => {
    setIsLoading(true)

    try {
      const result = await onConfirm()

      if (result.success) {
        toast.success(successMessage)
        onSuccess?.()
      } else {
        const errorMsg = result.error || errorMessage
        toast.error(errorMsg)
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : errorMessage
      toast.error(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{title}</AlertDialogTitle>
        {description && (
          <AlertDialogDescription>{description}</AlertDialogDescription>
        )}
      </AlertDialogHeader>

      <AlertDialogFooter>
        <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
        <Button
          onClick={handleConfirm}
          disabled={isLoading}
          loading={isLoading}
          variant="destructive"
        >
          Confirmar
        </Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  )
}
