'use client'

// No client-side React hooks needed in this component

import { AlertCircle } from 'lucide-react'

import {
  Alert,
  AlertDescription,
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Checkbox,
  Label
} from '@/components/ui'
import useUserPlayas from '@/hooks/useUserPlayas'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedPlayas: any[]
  onSelectedPlayasChange: (playas: any[]) => void
  onConfirm: () => void
  isLoading: boolean
  playeroNombre: string
  assignedPlayas?: string[]
}

export default function AssignPlayasDialog({
  open,
  onOpenChange,
  selectedPlayas,
  onSelectedPlayasChange,
  onConfirm,
  isLoading,
  playeroNombre,
  assignedPlayas = []
}: Props) {
  const { playas, loading, error } = useUserPlayas({ assignedPlayas })

  const handleToggle = (playa: any, checked?: boolean) => {
    // If Checkbox passes the checked value, use it; otherwise toggle based on presence
    const id = playa.playa_id ?? playa.id ?? String(playa.value ?? '')
    const isPresent = selectedPlayas.some((p: any) => {
      const pid = p?.playa_id ?? p?.id ?? String(p ?? '')
      return pid === id
    })
    const isChecked = typeof checked === 'boolean' ? checked : !isPresent

    if (isChecked) {
      if (!isPresent) onSelectedPlayasChange([...selectedPlayas, playa])
    } else {
      onSelectedPlayasChange(
        selectedPlayas.filter((p: any) => {
          const pid = p?.playa_id ?? p?.id ?? String(p ?? '')
          return pid !== id
        })
      )
    }
  }

  const handleSelectAll = () => {
    const available = playas ?? []
    if (selectedPlayas.length === available.length) {
      onSelectedPlayasChange([])
    } else {
      // Pass the full playa objects so parent can use metadata
      onSelectedPlayasChange(available)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Asignar playas</AlertDialogTitle>
          <AlertDialogDescription>
            Selecciona las playas que querés asignar a{' '}
            <strong>{playeroNombre}</strong>. El playero obtendrá acceso a las
            playas seleccionadas.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">
              Playas Disponibles ({(playas ?? []).length})
            </Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              disabled={isLoading}
            >
              {selectedPlayas.length === (playas ?? []).length
                ? 'Deseleccionar Todas'
                : 'Seleccionar Todas'}
            </Button>
          </div>

          <div className="max-h-[300px] space-y-2 overflow-y-auto rounded-lg border p-4">
            {loading || !playas ? (
              <p className="py-4 text-center text-sm">Cargando playas...</p>
            ) : error ? (
              <p className="py-4 text-center text-sm">Error cargando playas</p>
            ) : (
              (playas ?? []).map((playa: any) => {
                const id =
                  playa.playa_id ?? playa.id ?? String(playa.value ?? '')
                const name =
                  playa.playa_nombre ?? playa.nombre ?? '(sin nombre)'
                const direccion = playa.playa_direccion ?? playa.direccion ?? ''

                const isChecked = selectedPlayas.some((p: any) => {
                  const pid = p?.playa_id ?? p?.id ?? String(p ?? '')
                  return pid === id
                })

                return (
                  <div
                    key={id}
                    className="hover:bg-muted flex items-start gap-3 rounded-md p-3"
                  >
                    <Checkbox
                      id={id}
                      checked={isChecked}
                      onCheckedChange={(checked) =>
                        handleToggle(playa, checked as boolean)
                      }
                      disabled={isLoading}
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor={id}
                        className="cursor-pointer font-medium"
                      >
                        {name}
                      </Label>
                      <p className="text-muted-foreground text-sm">
                        {direccion}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {selectedPlayas.length > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Vas a asignar {selectedPlayas.length} playa(s) a este playero.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
          <Button
            onClick={onConfirm}
            disabled={selectedPlayas.length === 0 || isLoading}
            loading={isLoading}
          >
            Asignar {selectedPlayas.length > 0 && `(${selectedPlayas.length})`}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
