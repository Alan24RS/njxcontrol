'use client'

import { useState } from 'react'

import { toast } from 'sonner'

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button
} from '@/components/ui'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  playeroId: string
  playaId: string
  playaNombre: string
  currentEstado: string
  playeroNombre: string
  onSuccess?: (nuevoEstado: string) => void
}

export default function ChangePlayaEstadoDialog({
  open,
  onOpenChange,
  playeroId: _playeroId,
  playaId: _playaId,
  playaNombre,
  currentEstado,
  playeroNombre,
  onSuccess
}: Props) {
  const [isLoading, setIsLoading] = useState(false)

  const handleConfirm = async () => {
    setIsLoading(true)
    try {
      const nuevo = currentEstado === 'ACTIVO' ? 'SUSPENDIDO' : 'ACTIVO'
      // Stage the estado change locally. Persistence happens when the user
      // clicks "Guardar cambios" in the parent component.
      toast.success(
        'Cambio de estado aplicado localmente. Guardá los cambios para confirmar.'
      )
      onOpenChange(false)
      onSuccess?.(nuevo)
    } catch (err) {
      console.error(err)
      toast.error('Error inesperado')
    } finally {
      setIsLoading(false)
    }
  }

  const target =
    currentEstado?.toLowerCase() === 'activo' ? 'Suspendido' : 'Activo'
  const isActivating = target.toLowerCase() === 'activo'
  const stateColor = (estado: string) =>
    estado?.toLowerCase() === 'activo' ? 'text-green-600' : 'text-amber-600'
  const explanation = isActivating
    ? '⚠️ Al activarlo, el playero podrá iniciar y finalizar sus turnos, gestionar ocupaciones y administrar abonados en la playa.'
    : '⚠️ Al suspenderlo, el playero quedará en modo observador y no podrá gestionar la playa.'

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Actualizar estado del playero</AlertDialogTitle>
        </AlertDialogHeader>
        <div className="pb-6">
          <div className="flex flex-col items-center">
            <h3 className="text-foreground text-center text-base">
              <span>Vas a cambiar el estado del playero</span>
              <strong className="mx-2 font-semibold">{playeroNombre}</strong>
              <span className="mx-2">en la playa</span>
              <strong className="font-semibold">{playaNombre}</strong>.
            </h3>

            <div className="mt-4 flex justify-center">
              <div className="text-center text-lg font-semibold">
                <span className={`${stateColor(currentEstado)} lowercase`}>
                  {currentEstado.toLowerCase()}
                </span>
                <span className="text-muted-foreground mx-3">→</span>
                <span className={`${stateColor(target)} lowercase`}>
                  {target.toLowerCase()}
                </span>
              </div>
            </div>

            <div className="border-muted/30 bg-muted/5 mt-4 rounded-md border p-3">
              <p className="text-muted-foreground text-sm">{explanation}</p>
            </div>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
          <Button onClick={handleConfirm} loading={isLoading} variant="default">
            Confirmar
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
