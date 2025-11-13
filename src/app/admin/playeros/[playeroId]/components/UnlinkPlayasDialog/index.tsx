'use client'

import { AlertTriangle } from 'lucide-react'

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

type Playa = {
  playa_id: string
  playa_nombre: string
  playa_direccion: string
  estado: string
  fecha_asignacion: string
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  playas: Playa[]
  selectedPlayas: string[]
  onSelectedPlayasChange: (playasIds: string[]) => void
  onConfirm: () => void
  isLoading: boolean
  playeroNombre: string
}

export default function UnlinkPlayasDialog({
  open,
  onOpenChange,
  playas,
  selectedPlayas,
  onSelectedPlayasChange,
  onConfirm,
  isLoading,
  playeroNombre
}: Props) {
  const handleToggle = (playaId: string) => {
    if (selectedPlayas.includes(playaId)) {
      onSelectedPlayasChange(selectedPlayas.filter((id) => id !== playaId))
    } else {
      onSelectedPlayasChange([...selectedPlayas, playaId])
    }
  }

  const handleSelectAll = () => {
    if (selectedPlayas.length === playas.length) {
      onSelectedPlayasChange([])
    } else {
      onSelectedPlayasChange(playas.map((p) => p.playa_id))
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Desvincular de Playas</AlertDialogTitle>
          <AlertDialogDescription>
            Selecciona las playas de las cuales deseas desvincular a{' '}
            <strong>{playeroNombre}</strong>. El playero perderá acceso a las
            playas seleccionadas.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">
              Playas Disponibles ({playas.length})
            </Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              disabled={isLoading}
            >
              {selectedPlayas.length === playas.length
                ? 'Deseleccionar Todas'
                : 'Seleccionar Todas'}
            </Button>
          </div>

          <div className="max-h-[300px] space-y-2 overflow-y-auto rounded-lg border p-4">
            {playas.map((playa) => (
              <div
                key={playa.playa_id}
                className="hover:bg-muted flex items-start gap-3 rounded-md p-3"
              >
                <Checkbox
                  id={playa.playa_id}
                  checked={selectedPlayas.includes(playa.playa_id)}
                  onCheckedChange={() => handleToggle(playa.playa_id)}
                  disabled={isLoading}
                />
                <div className="flex-1">
                  <Label
                    htmlFor={playa.playa_id}
                    className="cursor-pointer font-medium"
                  >
                    {playa.playa_nombre}
                  </Label>
                  <p className="text-muted-foreground text-sm">
                    {playa.playa_direccion}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {selectedPlayas.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Vas a desvincular al playero de {selectedPlayas.length}{' '}
                playa(s).
                {selectedPlayas.length === playas.length && (
                  <strong>
                    {' '}
                    Al desvincular de todas las playas, el playero seguirá
                    apareciendo en tu listado.
                  </strong>
                )}
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
            variant="destructive"
          >
            Desvincular{' '}
            {selectedPlayas.length > 0 && `(${selectedPlayas.length})`}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
