'use client'

import { useEffect, useMemo, useState } from 'react'
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
import {
  calculateProratedAmount,
  getDaysInMonth,
  getDaysUntilEndOfMonth
} from '@/services/abonos'
import { useSelectedPlaya } from '@/stores/useSelectedPlaya'

export default function PagoStep() {
  const { control, watch, setValue } = useFormContext<CreateAbonoFormData>()
  const [montoProrrateo, setMontoProrrateo] = useState(0)
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
      const fechaHoy = new Date()
      const monto = calculateProratedAmount(tarifaMensual, fechaHoy)
      setMontoProrrateo(monto)
      setValue('montoPago', monto)
    }
  }, [tarifaMensual, setValue])

  const diasEnMes = getDaysInMonth(new Date())
  const diasHastaFinDeMes = getDaysUntilEndOfMonth(new Date())

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
        <h3 className="text-lg font-semibold">Cálculo del primer pago</h3>

        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tarifa mensual:</span>
            <span className="font-medium">
              ${tarifaMensual.toLocaleString()}
            </span>
          </div>

          <div className="space-y-2 rounded-lg bg-white p-4 text-sm dark:bg-gray-900">
            <p className="font-medium">Cálculo proporcional:</p>
            <p className="text-muted-foreground">
              • Días de este mes: {diasEnMes}
            </p>
            <p className="text-muted-foreground">
              • Días restantes de este mes (incluido hoy): {diasHastaFinDeMes}
            </p>
            <p className="text-muted-foreground">
              • Fórmula: (${tarifaMensual} ÷ {diasEnMes}) × {diasHastaFinDeMes}{' '}
              = ${montoProrrateo.toLocaleString()}
            </p>
          </div>

          <div className="flex justify-between border-t pt-3">
            <span className="text-lg font-semibold">Total a pagar hoy:</span>
            <span className="text-lg font-bold text-green-600">
              ${montoProrrateo.toLocaleString()}
            </span>
          </div>

          <p className="text-muted-foreground text-sm">
            El último día de este mes se generará automáticamente la boleta del
            próximo mes por ${tarifaMensual.toLocaleString()}, con vencimiento a
            15 días. Este proceso se repetirá mensualmente.
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
              Generación de boleta pagada por ${montoProrrateo.toLocaleString()}
            </li>
            <li>Registro del pago vinculado a tu turno activo</li>
            <li>Reserva automática de la plaza seleccionada</li>
            <li>
              Suma de ${montoProrrateo.toLocaleString()} a tu recaudación del
              turno
            </li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  )
}
