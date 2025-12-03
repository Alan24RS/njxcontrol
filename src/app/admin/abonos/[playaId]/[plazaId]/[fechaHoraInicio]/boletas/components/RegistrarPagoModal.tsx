'use client'

import {
  startTransition,
  useActionState,
  useEffect,
  useMemo,
  useRef
} from 'react'
import { useForm } from 'react-hook-form'

import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { z } from 'zod'

import { registrarPagoBoletaAction } from '@/app/admin/abonos/actions'
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
import { useGetMetodosPagoPlaya } from '@/hooks/queries/metodos-pago-playa/getMetodosPagoPlaya'
import type { Boleta } from '@/services/abonos/types'

type RegistrarPagoFormData = {
  monto: number
  metodoPago: string
}

const registrarPagoSchema = z.object({
  monto: z
    .number({ message: 'El monto es requerido' })
    .positive('El monto debe ser mayor a 0'),
  metodoPago: z.string({ message: 'Selecciona un método de pago' })
})

interface RegistrarPagoModalProps {
  boleta: Boleta
  _playaId?: string
  _fechaHoraInicio?: string
  isOpen?: boolean
  open?: boolean
  onClose?: () => void
  onOpenChange?: (open: boolean) => void
  onSuccess: () => void
}

export default function RegistrarPagoModal({
  boleta,
  _playaId,
  _fechaHoraInicio,
  isOpen,
  open,
  onClose,
  onOpenChange,
  onSuccess
}: RegistrarPagoModalProps) {
  const isModalOpen = isOpen ?? open ?? false
  const handleClose = () => {
    if (onClose) onClose()
    if (onOpenChange) onOpenChange(false)
  }

  const [formState, formAction, pending] = useActionState(
    registrarPagoBoletaAction,
    {
      success: false
    }
  )

  const formRef = useRef<HTMLFormElement>(null)
  const processedSuccessRef = useRef(false)

  const { data: metodosPagoResponse } = useGetMetodosPagoPlaya(
    {
      playaId: boleta.playaId,
      page: 1,
      limit: 50
    },
    {
      enabled: isOpen && !!boleta.playaId
    }
  )

  const metodosActivos = useMemo(
    () =>
      metodosPagoResponse?.data?.filter((item) => item.estado === 'ACTIVO') ||
      [],
    [metodosPagoResponse]
  )

  const form = useForm<RegistrarPagoFormData>({
    resolver: zodResolver(registrarPagoSchema),
    defaultValues: {
      monto: boleta.deudaPendiente,
      metodoPago: undefined
    }
  })

  const watchMonto = form.watch('monto')

  useEffect(() => {
    if (formState.success && !processedSuccessRef.current) {
      processedSuccessRef.current = true
      const deudaRestante = formState.data?.deudaPendiente || 0
      const montoPagado = watchMonto

      if (deudaRestante === 0) {
        toast.success('¡Boleta pagada completamente!', {
          description: `Se registró un pago de $${montoPagado.toLocaleString()}`
        })
      } else {
        toast.success('Pago registrado exitosamente', {
          description: `Monto pagado: $${montoPagado.toLocaleString()}. Resta pagar: $${deudaRestante.toLocaleString()}`
        })
      }

      form.reset()
      onSuccess()
      handleClose()
    } else if (formState.error) {
      toast.error('Error al registrar pago', {
        description: formState.error
      })
    } else if (formState.errors) {
      Object.entries(formState.errors).forEach(([field, errors]) => {
        if (field === 'general') {
          toast.error('Error', {
            description: errors.join(', '),
            duration: 6000
          })
        } else {
          errors.forEach((error) => {
            toast.error(`Error en ${field}`, {
              description: error,
              duration: 5000
            })
          })
        }
      })
    }
  }, [formState, watchMonto, onSuccess, handleClose, form])

  useEffect(() => {
    if (!isOpen) {
      processedSuccessRef.current = false
      form.reset({
        monto: boleta.deudaPendiente,
        metodoPago: undefined
      })
    }
  }, [isOpen, boleta.deudaPendiente, form])

  const handleSubmit = (data: RegistrarPagoFormData) => {
    if (data.monto > boleta.deudaPendiente) {
      toast.error('El monto no puede ser mayor a la deuda pendiente')
      return
    }

    if (data.monto <= 0) {
      toast.error('El monto debe ser mayor a 0')
      return
    }

    if (!data.metodoPago) {
      toast.error('Selecciona un método de pago')
      return
    }

    const metodoValido = metodosActivos.some(
      (m) => m.metodoPago === data.metodoPago
    )
    if (!metodoValido) {
      toast.error('El método de pago seleccionado no está disponible')
      return
    }

    const formData = new FormData()
    formData.append('playaId', boleta.playaId)
    formData.append('plazaId', boleta.plazaId)
    formData.append(
      'fechaHoraInicioAbono',
      boleta.fechaHoraInicioAbono.toISOString()
    )
    formData.append(
      'fechaGeneracionBoleta',
      boleta.fechaGeneracion.toISOString()
    )
    formData.append('monto', data.monto.toString())
    formData.append('metodoPago', data.metodoPago)

    startTransition(() => {
      formAction(formData)
    })
  }

  return (
    <Dialog
      open={isModalOpen}
      onOpenChange={(open) => {
        if (!open) handleClose()
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar pago de boleta</DialogTitle>
          <DialogDescription>
            Deuda pendiente: ${boleta.deudaPendiente.toLocaleString()}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            ref={formRef}
            action={formAction}
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
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
                      {metodosActivos.length > 0 ? (
                        metodosActivos.map((metodo) => (
                          <SelectItem
                            key={metodo.metodoPago}
                            value={metodo.metodoPago}
                          >
                            {metodo.metodoPago}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="text-muted-foreground px-2 py-1.5 text-sm">
                          No hay métodos de pago activos
                        </div>
                      )}
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
                disabled={pending}
                type="button"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={pending} loading={pending}>
                Registrar pago
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
