'use client'

import { useState } from 'react'

import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Card,
  CardContent
} from '@/components/ui'
import {
  ESTADO_PLAYA_LABEL,
  PLAYA_ESTADO,
  PlayaEstado
} from '@/constants/playaEstado'
import { cn } from '@/lib/utils'

import { updatePlayaEstadoAction } from '../actions'

interface PlayaStatusCardProps {
  playaId: string
  currentEstado: PlayaEstado
  onEstadoChange?: (newEstado: PlayaEstado) => void
}

const getCardColors = (estado: PlayaEstado) => {
  switch (estado) {
    case PLAYA_ESTADO.BORRADOR:
      return 'border-gray-300 bg-gray-50/50 text-gray-900 dark:border-gray-600 dark:bg-gray-800/50 dark:text-gray-100'
    case PLAYA_ESTADO.SUSPENDIDO:
      return 'border-yellow-300 bg-yellow-50/50 text-yellow-900 dark:border-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-100'
    case PLAYA_ESTADO.ACTIVO:
      return 'border-green-300 bg-green-50/50 text-green-900 dark:border-green-600 dark:bg-green-900/20 dark:text-green-100'
    default:
      return 'border-gray-300 bg-gray-50/50 text-gray-900 dark:border-gray-600 dark:bg-gray-800/50 dark:text-gray-100'
  }
}

const getEstadoDescription = (estado: PlayaEstado) => {
  switch (estado) {
    case PLAYA_ESTADO.ACTIVO:
      return 'La playa empezará a ser visible para los conductores'
    case PLAYA_ESTADO.SUSPENDIDO:
      return 'La playa ya no será visible para los conductores'
    default:
      return ''
  }
}

const getNextEstado = (currentEstado: PlayaEstado): PlayaEstado | null => {
  switch (currentEstado) {
    case PLAYA_ESTADO.BORRADOR:
      return PLAYA_ESTADO.ACTIVO
    case PLAYA_ESTADO.ACTIVO:
      return PLAYA_ESTADO.SUSPENDIDO
    case PLAYA_ESTADO.SUSPENDIDO:
      return PLAYA_ESTADO.ACTIVO
    default:
      return null
  }
}

const getButtonText = (currentEstado: PlayaEstado): string => {
  switch (currentEstado) {
    case PLAYA_ESTADO.BORRADOR:
      return 'Activar playa'
    case PLAYA_ESTADO.ACTIVO:
      return 'Suspender playa'
    case PLAYA_ESTADO.SUSPENDIDO:
      return 'Activar playa'
    default:
      return ''
  }
}

export default function PlayaStatusCard({
  playaId,
  currentEstado,
  onEstadoChange
}: PlayaStatusCardProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const nextEstado = getNextEstado(currentEstado)
  const buttonText = getButtonText(currentEstado)
  const cardColors = getCardColors(currentEstado)

  const handleButtonClick = () => {
    if (nextEstado) {
      setShowConfirmDialog(true)
    }
  }

  const handleConfirmChange = async () => {
    if (!nextEstado) return

    try {
      setIsLoading(true)

      const result = await updatePlayaEstadoAction(playaId, nextEstado)

      if (!result.success) {
        toast.error('Error al actualizar el estado', {
          description: result.error
        })
        setIsLoading(false)
        return
      }

      toast.success('Estado actualizado exitosamente')
      onEstadoChange?.(nextEstado)
      setShowConfirmDialog(false)
    } catch (error) {
      console.error('Error updating playa estado:', error)
      toast.error('Error inesperado', {
        description:
          'Ocurrió un error al actualizar el estado. Intenta nuevamente.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelChange = () => {
    setShowConfirmDialog(false)
  }

  return (
    <>
      <Card className={cn('border-2', cardColors)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm opacity-75">Estado actual:</span>
              <span className="text-sm font-bold">
                {ESTADO_PLAYA_LABEL[currentEstado]}
              </span>
            </div>

            {nextEstado && (
              <Button
                size="sm"
                onClick={handleButtonClick}
                className="flex items-center gap-2"
              >
                {buttonText}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog
        open={showConfirmDialog}
        onOpenChange={isLoading ? undefined : setShowConfirmDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar cambio de estado</AlertDialogTitle>
            <AlertDialogDescription>
              {nextEstado && (
                <>
                  ¿Estás seguro de que quieres cambiar el estado a{' '}
                  <strong>{ESTADO_PLAYA_LABEL[nextEstado]}</strong>?
                  <br />
                  <br />
                  {getEstadoDescription(nextEstado)}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={handleCancelChange}
              disabled={isLoading}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmChange}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                'Confirmar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
