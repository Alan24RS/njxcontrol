'use client'

import { useState } from 'react'

import { toast } from 'sonner'

import { Spinner } from '@/components/ui'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  SelectableCardGroup,
  SelectableCardItem
} from '@/components/ui/selectable-card-group'

export type StatusModalOption = {
  value: string
  label: string
}

export type StatusModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  currentStatus: string
  options: StatusModalOption[]
  onStatusChange: (
    newStatus: string
  ) => Promise<{ success: boolean; message?: string }>
}

export function StatusModal({
  open,
  onOpenChange,
  title,
  description,
  currentStatus,
  options,
  onStatusChange
}: StatusModalProps) {
  const [selectedStatus, setSelectedStatus] = useState(currentStatus)
  const [isLoading, setIsLoading] = useState(false)

  const hasChanges = selectedStatus !== currentStatus

  const handleSave = async () => {
    if (!hasChanges || isLoading) return

    setIsLoading(true)
    try {
      const result = await onStatusChange(selectedStatus)

      if (result.success) {
        toast.success(result.message || 'Estado actualizado correctamente')
        onOpenChange(false)
      } else {
        toast.error(result.message || 'Error al actualizar el estado')
      }
    } catch {
      toast.error('Error inesperado al actualizar el estado')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen)
    // Solo resetear después de que el modal se haya cerrado
    if (!newOpen) {
      // Usar setTimeout para evitar el flash visual
      setTimeout(() => {
        setSelectedStatus(currentStatus)
      }, 150) // Tiempo suficiente para que la animación de cierre termine
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="py-4">
          <SelectableCardGroup
            mode="single"
            value={selectedStatus}
            onValueChange={(value) => {
              if (typeof value === 'string') {
                setSelectedStatus(value)
              } else if (typeof value === 'number') {
                setSelectedStatus(String(value))
              }
            }}
            className="grid w-full gap-2"
          >
            {options.map((option) => (
              <SelectableCardItem
                value={option.value}
                key={option.value}
                disabled={isLoading}
              >
                {option.label}
              </SelectableCardItem>
            ))}
          </SelectableCardGroup>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges || isLoading}>
            {isLoading && <Spinner className="mr-2 h-4 w-4" />}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
