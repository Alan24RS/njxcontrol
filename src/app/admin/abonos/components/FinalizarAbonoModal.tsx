'use client'

import { useState } from 'react'

import { AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Spinner } from '@/components/ui/spinner'

interface FinalizarAbonoModalProps {
  playaId: string
  plazaId: string
  fechaHoraInicio: string
  isOpen: boolean
  onClose: () => void
}

export default function FinalizarAbonoModal({
  playaId,
  plazaId,
  fechaHoraInicio,
  isOpen,
  onClose
}: FinalizarAbonoModalProps) {
  const [loading, setLoading] = useState(false)

  const handleFinalizar = async () => {
    setLoading(true)
    try {
      const { finalizarAbonoAction } = await import(
        '@/app/admin/abonos/actions'
      )
      const result = await finalizarAbonoAction(
        playaId,
        plazaId,
        fechaHoraInicio
      )

      if (result.error) {
        toast.error('Error al finalizar abono', {
          description: result.error
        })
        return
      }

      toast.success('Abono finalizado exitosamente', {
        description: 'La plaza ha sido liberada'
      })

      onClose()
    } catch (error) {
      toast.error('Error inesperado', {
        description:
          error instanceof Error
            ? error.message
            : 'No se pudo finalizar el abono'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Finalizar abono</DialogTitle>
          <DialogDescription>
            Esta acción finalizará el abono y liberará la plaza
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <p className="mb-2 font-semibold">Importante:</p>
            <ul className="list-inside list-disc space-y-1 text-sm">
              <li>El abonado debe haber pagado todas sus boletas pendientes</li>
              <li>La plaza quedará disponible para otros usos</li>
              <li>Esta acción no se puede deshacer</li>
            </ul>
          </AlertDescription>
        </Alert>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleFinalizar}
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Finalizando...
              </>
            ) : (
              'Finalizar abono'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
