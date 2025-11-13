'use client'

import { useFieldArray, useFormContext } from 'react-hook-form'

import { Check, CreditCard, DollarSign, Smartphone } from 'lucide-react'

import { Card, CardContent } from '@/components/ui'
import { METODO_PAGO, METODO_PAGO_LABEL } from '@/constants/metodoPago'
import type { WelcomeSetupFormData } from '@/schemas/welcome-setup'

const METODO_PAGO_ICONS = {
  [METODO_PAGO.EFECTIVO]: DollarSign,
  [METODO_PAGO.TRANSFERENCIA]: CreditCard,
  [METODO_PAGO.MERCADO_PAGO]: Smartphone
}

export default function MetodosPagoStep() {
  const { control, watch } = useFormContext<WelcomeSetupFormData>()

  const { append, remove } = useFieldArray({
    control,
    name: 'metodosPago'
  })

  const metodosPago = watch('metodosPago') || []

  const isSelected = (metodoPago: string) => {
    return metodosPago.some((m) => m.metodoPago === metodoPago)
  }

  const toggleMetodoPago = (metodoPago: string) => {
    const index = metodosPago.findIndex((m) => m.metodoPago === metodoPago)

    if (index !== -1) {
      remove(index)
    } else {
      append({ metodoPago: metodoPago as any })
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Object.values(METODO_PAGO).map((metodo) => {
          const Icon = METODO_PAGO_ICONS[metodo]
          const selected = isSelected(metodo)

          return (
            <Card
              key={metodo}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selected
                  ? 'dark:border-blue-500 dark:bg-blue-800/20 dark:ring-2 dark:ring-blue-200'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => toggleMetodoPago(metodo)}
            >
              <CardContent className="flex flex-col items-center p-6">
                <div className="relative mb-4">
                  <div
                    className={`flex h-16 w-16 items-center justify-center rounded-full ${
                      selected
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    <Icon className="h-8 w-8" />
                  </div>
                  {selected && (
                    <div className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white">
                      <Check className="h-4 w-4" />
                    </div>
                  )}
                </div>
                <h4 className="text-center font-medium">
                  {METODO_PAGO_LABEL[metodo]}
                </h4>
                <p className="text-muted-foreground mt-1 text-center text-sm">
                  {metodo === METODO_PAGO.EFECTIVO && 'Pagos en efectivo'}
                  {metodo === METODO_PAGO.TRANSFERENCIA &&
                    'Transferencias bancarias'}
                  {metodo === METODO_PAGO.MERCADO_PAGO && 'Pagos digitales'}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {metodosPago.length === 0 && (
        <div className="border-muted-foreground/25 rounded-lg border-2 border-dashed p-8 text-center">
          <p className="text-muted-foreground">
            No has seleccionado ningún método de pago. Puedes omitir este paso
            si lo deseas.
          </p>
        </div>
      )}
    </div>
  )
}
