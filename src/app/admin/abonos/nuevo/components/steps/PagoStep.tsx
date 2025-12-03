'use client'

import { useEffect, useMemo } from 'react'
import { useFormContext } from 'react-hook-form'

import { AlertTriangle } from 'lucide-react'

import {
  Alert,
  AlertDescription,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui'
import { METODO_PAGO_LABEL } from '@/constants/metodoPago'
import { useGetMetodosPagoPlaya } from '@/hooks/queries/metodos-pago-playa/getMetodosPagoPlaya'
import type { CreateAbonoFormData } from '@/schemas/abono'
import { useSelectedPlaya } from '@/stores/useSelectedPlaya'

export default function PagoStep() {
  const { control, watch, setValue } = useFormContext<CreateAbonoFormData>()
  const { selectedPlaya } = useSelectedPlaya()

  const tarifaMensual = watch('tarifaMensual')
  const nombre = watch('nombre')
  const apellido = watch('apellido')
  const dni = watch('dni')
  const vehiculos = watch('vehiculos') || []

  const { data: metodosPagoResponse, isLoading: metodosLoading } =
    useGetMetodosPagoPlaya(
      {
        playaId: selectedPlaya?.id ?? '',
        page: 1,
        limit: 50
      },
      {
        enabled: !!selectedPlaya?.id
      }
    )

  const metodosActivos = useMemo(
    () =>
      metodosPagoResponse?.data?.filter((item) => item.estado === 'ACTIVO') ||
      [],
    [metodosPagoResponse]
  )

  useEffect(() => {
    if (tarifaMensual > 0) {
      setValue('montoPago', tarifaMensual)
    }
  }, [tarifaMensual, setValue])

  const fechaActual = new Date()

  return (
    <div className="space-y-6">
      <div className="bg-muted/50 space-y-4 rounded-lg border p-6">
        <h3 className="text-lg font-semibold">Resumen del abono</h3>

        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Abonado:</span>
            <span className="font-medium">
              {nombre} {apellido} (DNI: {dni})
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-muted-foreground">Fecha de inicio:</span>
            <span className="font-medium">
              {fechaActual.toLocaleString('es-AR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}{' '}
              hs
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-muted-foreground">Vehículos:</span>
            <div className="text-right">
              {vehiculos.map((v, i) => (
                <div key={i} className="font-medium">
                  {v.patente} ({v.tipoVehiculo})
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 rounded-lg border bg-blue-50 p-6 dark:bg-blue-950/20">
        <h3 className="text-lg font-semibold">Pago inicial</h3>

        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tarifa mensual:</span>
            <span className="font-medium">
              ${tarifaMensual.toLocaleString()}
            </span>
          </div>

          <div className="rounded-lg bg-white p-4 text-sm dark:bg-gray-900">
            <p className="text-muted-foreground">
              El abono se cobra por adelantado. Se debe pagar el mes completo al
              momento de la creación.
            </p>
          </div>

          <div className="flex justify-between border-t pt-3">
            <span className="text-lg font-semibold">Total a pagar hoy:</span>
            <span className="text-lg font-bold text-green-600">
              ${tarifaMensual.toLocaleString()}
            </span>
          </div>

          <p className="text-muted-foreground text-sm">
            La primera boleta se generará con el precio mensual completo. Las
            próximas boletas se generarán automáticamente 3 días antes del
            vencimiento, que será el mismo día del mes siguiente.
          </p>
        </div>
      </div>

      <FormField
        control={control}
        name="metodoPago"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Método de pago</FormLabel>
            <Select
              onValueChange={field.onChange}
              value={field.value ?? ''}
              disabled={metodosLoading || metodosActivos.length === 0}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      metodosLoading
                        ? 'Cargando métodos...'
                        : metodosActivos.length === 0
                          ? 'No hay métodos de pago disponibles'
                          : 'Selecciona un método de pago'
                    }
                  />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {metodosActivos.map((metodo) => (
                  <SelectItem key={metodo.metodoPago} value={metodo.metodoPago}>
                    {METODO_PAGO_LABEL[metodo.metodoPago]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <p className="mb-2 font-semibold">Al confirmar se realizará:</p>
          <ul className="list-inside list-disc space-y-1 text-sm">
            <li>Creación del abono y registro del abonado</li>
            <li>
              Generación de boleta pagada por ${tarifaMensual.toLocaleString()}
            </li>
            <li>Registro del pago vinculado a tu turno activo</li>
            <li>Reserva automática de la plaza seleccionada</li>
            <li>
              Suma de ${tarifaMensual.toLocaleString()} a tu recaudación del
              turno
            </li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  )
}
