'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { z } from 'zod'

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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { METODO_PAGO, METODO_PAGO_LABEL } from '@/constants/metodoPago'
import type { Boleta } from '@/services/abonos/types'

const registrarPagoSchema = z.object({
  monto: z
    .number({ message: 'El monto es requerido' })
    .positive('El monto debe ser mayor a 0'),
  metodoPago: z.enum(['EFECTIVO', 'TRANSFERENCIA', 'MERCADO_PAGO'], {
    message: 'Selecciona un método de pago'
  })
})

type RegistrarPagoFormData = z.infer<typeof registrarPagoSchema>

interface RegistrarPagoModalProps {
  boleta: Boleta
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function RegistrarPagoModal({
  boleta,
  isOpen,
  onClose,
  onSuccess
}: RegistrarPagoModalProps) {
  const [loading, setLoading] = useState(false)

  const form = useForm<RegistrarPagoFormData>({
    resolver: zodResolver(registrarPagoSchema),
    defaultValues: {
      monto: boleta.deudaPendiente,
      metodoPago: undefined
    }
  })

  const watchMonto = form.watch('monto')

  const onSubmit = async (data: RegistrarPagoFormData) => {
    if (data.monto > boleta.deudaPendiente) {
      toast.error('El monto no puede ser mayor a la deuda pendiente')
      return
    }

    setLoading(true)
    try {
      const { registrarPagoBoletaAction } = await import(
        '@/app/admin/abonos/actions'
      )
      const result = await registrarPagoBoletaAction({
        playaId: boleta.playaId,
        plazaId: boleta.plazaId,
        fechaHoraInicioAbono: boleta.fechaHoraInicioAbono.toISOString(),
        fechaGeneracionBoleta: boleta.fechaGeneracion.toISOString(),
        monto: data.monto,
        metodoPago: data.metodoPago
      })

      if (result.error) {
        toast.error('Error al registrar pago', {
          description: result.error
        })
        return
      }

      const deudaRestante = result.data?.deudaPendiente || 0

      if (deudaRestante === 0) {
        toast.success('¡Boleta pagada completamente!', {
          description: `Se registró un pago de $${data.monto.toLocaleString()}`
        })
      } else {
        toast.success('Pago registrado exitosamente', {
          description: `Monto pagado: $${data.monto.toLocaleString()}. Resta pagar: $${deudaRestante.toLocaleString()}`
        })
      }

      onSuccess()
    } catch (error) {
      toast.error('Error inesperado', {
        description:
          error instanceof Error
            ? error.message
            : 'No se pudo registrar el pago'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar pago de boleta</DialogTitle>
          <DialogDescription>
            Deuda pendiente: ${boleta.deudaPendiente.toLocaleString()}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="monto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monto a pagar</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                      value={field.value}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value) || 0)
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    Máximo: ${boleta.deudaPendiente.toLocaleString()}
                  </FormDescription>
                  {watchMonto > boleta.deudaPendiente && (
                    <p className="text-destructive text-sm">
                      El monto no puede ser mayor a la deuda pendiente
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="metodoPago"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Método de pago</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value ?? ''}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un método" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(METODO_PAGO).map((value) => (
                        <SelectItem key={value} value={value}>
                          {METODO_PAGO_LABEL[value]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                variant="outline"
                onClick={onClose}
                disabled={loading}
                type="button"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Registrando...
                  </>
                ) : (
                  'Registrar pago'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
