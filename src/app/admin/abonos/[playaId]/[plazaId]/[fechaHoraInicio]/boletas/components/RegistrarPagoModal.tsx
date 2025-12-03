'use client'

import {
  startTransition,
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'
import { useForm } from 'react-hook-form'

import { zodResolver } from '@hookform/resolvers/zod'
import { Download } from 'lucide-react'
import { toast } from 'sonner'
import { z } from 'zod'

import { registrarPagoBoletaAction } from '@/app/admin/abonos/actions'
import { getAbonoByIdAction } from '@/app/admin/abonos/queries'
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
import { METODO_PAGO_LABEL } from '@/constants/metodoPago'
import { useGetMetodosPagoPlaya } from '@/hooks/queries/metodos-pago-playa/getMetodosPagoPlaya'
import type { Boleta } from '@/services/abonos/types'
import { generarComprobantePDF } from '@/utils/pdf/generarComprobante'

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
  const [formState, formAction, pending] = useActionState(
    registrarPagoBoletaAction,
    {
      success: false
    }
  )

  const formRef = useRef<HTMLFormElement>(null)
  const processedSuccessRef = useRef(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [pagoData, setPagoData] = useState<{
    montoPagado: number
    metodoPago: string
  } | null>(null)
  const [abonoData, setAbonoData] = useState<any>(null)

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
      const montoPagado = watchMonto
      const metodoPago = form.getValues('metodoPago') || ''

      setPagoData({
        montoPagado,
        metodoPago
      })
      setShowSuccess(true)

      const fetchAbonoData = async () => {
        try {
          const result = await getAbonoByIdAction(
            boleta.playaId,
            boleta.plazaId,
            boleta.fechaHoraInicioAbono.toISOString()
          )
          if (result.data) {
            setAbonoData(result.data)
          }
        } catch (error) {
          console.error('Error al obtener datos del abono:', error)
        }
      }
      fetchAbonoData()
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
  }, [
    formState,
    watchMonto,
    onSuccess,
    onClose,
    form,
    boleta.playaId,
    boleta.plazaId,
    boleta.fechaHoraInicioAbono
  ])

  useEffect(() => {
    if (!isOpen) {
      processedSuccessRef.current = false
      setShowSuccess(false)
      setPagoData(null)
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

  const handleDownloadPDF = async () => {
    if (!pagoData || !abonoData) {
      toast.error('Error', {
        description:
          'No se pudo obtener la información necesaria para generar el comprobante'
      })
      return
    }

    try {
      const vehiculo = abonoData.vehiculos?.[0] || {
        patente: 'N/A',
        tipoVehiculo: 'N/A'
      }

      const periodo = boleta.fechaVencimiento.toLocaleDateString('es-AR', {
        month: 'long',
        year: 'numeric'
      })

      generarComprobantePDF({
        boleta: {
          monto: boleta.monto,
          montoPagado: boleta.montoPagado + pagoData.montoPagado,
          fechaGeneracion: boleta.fechaGeneracion,
          fechaVencimiento: boleta.fechaVencimiento,
          estado: 'PAGADA'
        },
        abonado: {
          nombre: abonoData.abonadoNombre,
          apellido: abonoData.abonadoApellido,
          dni: abonoData.abonadoDni,
          telefono: boleta.abonadoTelefono,
          email: null
        },
        servicio: {
          playaNombre: 'Estacionamiento',
          plazaIdentificador: abonoData.plazaIdentificador,
          tipoPlazaNombre: abonoData.tipoPlazaNombre,
          vehiculo: {
            patente: vehiculo.patente,
            tipoVehiculo: vehiculo.tipoVehiculo
          },
          periodo
        },
        pago: {
          fechaPago: new Date(),
          metodoPago:
            METODO_PAGO_LABEL[
              pagoData.metodoPago as keyof typeof METODO_PAGO_LABEL
            ] || pagoData.metodoPago,
          montoPagado: pagoData.montoPagado
        }
      })
    } catch (error) {
      console.error('Error al generar PDF:', error)
      toast.error('Error', {
        description: 'No se pudo generar el comprobante PDF'
      })
    }
  }

  const handleClose = () => {
    if (showSuccess) {
      onSuccess()
    }
    onClose()
  }

  if (showSuccess && pagoData) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pago Registrado</DialogTitle>
            <DialogDescription>
              El pago se ha registrado exitosamente
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Monto pagado:</span>
                  <span className="font-semibold">
                    ${pagoData.montoPagado.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Método de pago:</span>
                  <span>{pagoData.metodoPago}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Deuda restante:</span>
                  <span>
                    ${(formState.data?.deudaPendiente || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose} type="button">
              Cerrar
            </Button>
            <Button
              onClick={handleDownloadPDF}
              type="button"
              disabled={!abonoData}
            >
              <Download className="mr-2 h-4 w-4" />
              Descargar Comprobante (PDF)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
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
                        <SelectItem value="" disabled>
                          No hay métodos de pago activos
                        </SelectItem>
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
