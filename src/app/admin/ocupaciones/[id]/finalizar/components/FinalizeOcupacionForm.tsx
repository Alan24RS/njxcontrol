'use client'

import { useActionState, useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'

import { useRouter } from 'next/navigation'

import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { Timer } from 'lucide-react'
import { toast } from 'sonner'

import {
  finalizarOcupacionAction,
  updateMetodoPagoAction
} from '@/app/admin/ocupaciones/actions'
import {
  Alert,
  AlertDescription,
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Spinner,
  Textarea
} from '@/components/ui'
import { METODO_PAGO_LABEL } from '@/constants/metodoPago'
import { MODALIDAD_OCUPACION_LABEL } from '@/constants/modalidadOcupacion'
import { OCUPACION_ESTADO } from '@/constants/ocupacionEstado'
import { useGetMetodosPagoPlaya } from '@/hooks/queries/metodos-pago-playa/getMetodosPagoPlaya'
import { useGetOcupacionById } from '@/hooks/queries/ocupaciones/getOcupacionById'
import { useGetTarifas } from '@/hooks/queries/tarifas/getTarifas'
import {
  finalizarOcupacionSchema,
  FinalizeOcupacionRequest
} from '@/schemas/ocupacion'
import { useSelectedPlaya } from '@/stores/useSelectedPlaya'
import { formatCurrency } from '@/utils/formatters'

type FormState = {
  success: boolean
  fields?: Record<string, string>
  errors?: Record<string, string[]>
}

type FinalizeOcupacionFormProps = {
  ocupacionId: string
}

function calculateMontoSugerido(
  modalidad: string,
  minutes: number,
  tarifaBase: number
): number {
  if (!tarifaBase || tarifaBase <= 0) return 0
  const durationMinutes = Math.max(minutes, 1)
  switch (modalidad) {
    case 'POR_HORA':
      return Math.ceil(durationMinutes / 60) * tarifaBase
    case 'DIARIA':
      return Math.ceil(durationMinutes / 1440) * tarifaBase
    case 'SEMANAL':
      return Math.ceil(durationMinutes / (1440 * 7)) * tarifaBase
    default:
      return tarifaBase
  }
}

export default function FinalizeOcupacionForm({
  ocupacionId
}: FinalizeOcupacionFormProps) {
  const [formStateFinalizar, formActionFinalizar, pendingFinalizar] =
    useActionState(finalizarOcupacionAction, {
      success: false
    } as FormState)

  const [formStateUpdate, formActionUpdate, pendingUpdate] = useActionState(
    updateMetodoPagoAction,
    {
      success: false
    } as FormState
  )

  const router = useRouter()
  const queryClient = useQueryClient()
  const { selectedPlaya } = useSelectedPlaya()

  const form = useForm<FinalizeOcupacionRequest>({
    resolver: zodResolver(finalizarOcupacionSchema),
    mode: 'onChange',
    defaultValues: {
      ocupacionId,
      playaId: selectedPlaya?.id,
      metodoPago: undefined,
      monto: undefined,
      observaciones: ''
    }
  })

  const {
    data: ocupacionResponse,
    isLoading: ocupacionLoading,
    error: ocupacionError
  } = useGetOcupacionById(ocupacionId)
  const ocupacion = ocupacionResponse?.data

  // Detectar si la ocupación ya está finalizada (para modo edición de método de pago)
  const isOcupacionFinalizada =
    ocupacion?.estado === OCUPACION_ESTADO.FINALIZADO

  // Usar el estado y acción correctos según si está finalizada o no
  const formState = isOcupacionFinalizada ? formStateUpdate : formStateFinalizar
  const formAction = isOcupacionFinalizada
    ? formActionUpdate
    : formActionFinalizar
  const pending = isOcupacionFinalizada ? pendingUpdate : pendingFinalizar

  const playaId = ocupacion?.playaId ?? selectedPlaya?.id ?? ''

  const { data: metodosPagoResponse, isLoading: metodosLoading } =
    useGetMetodosPagoPlaya(
      {
        playaId,
        page: 1,
        limit: 50
      },
      {
        enabled: !!playaId
      }
    )

  const metodosActivos = useMemo(
    () => metodosPagoResponse?.data?.filter((item) => item.estado === 'ACTIVO'),
    [metodosPagoResponse]
  )

  const { data: tarifasResponse, isLoading: tarifasLoading } = useGetTarifas(
    {
      playaId,
      tipoPlaza: ocupacion?.tipoPlazaId,
      modalidadOcupacion: ocupacion?.modalidadOcupacion,
      tipoVehiculo: ocupacion?.tipoVehiculo,
      page: 1,
      limit: 1
    },
    {
      enabled: !!(playaId && ocupacion?.tipoPlazaId)
    }
  )

  const tarifaBase = tarifasResponse?.data?.[0]?.precioBase ?? 0

  const [datosInicializados, setDatosInicializados] = useState<boolean>(false)

  // Resetear el estado cuando cambia el ocupacionId e invalidar caché
  useEffect(() => {
    setDatosInicializados(false)
    // Invalidar el caché de la ocupación para forzar refetch con datos frescos
    queryClient.invalidateQueries({ queryKey: ['ocupacion', ocupacionId] })
  }, [ocupacionId, queryClient])

  useEffect(() => {
    // Si la ocupación está finalizada, cargar los datos del pago existente
    if (isOcupacionFinalizada && ocupacion && !datosInicializados && playaId) {
      // Usar reset en lugar de setValue para evitar el warning uncontrolled->controlled
      form.reset({
        ocupacionId,
        playaId,
        metodoPago: ocupacion.metodoPago ?? undefined,
        monto: ocupacion.montoPago ?? undefined,
        observaciones: ocupacion.pagoObservaciones ?? ''
      })

      setDatosInicializados(true)
      return
    }

    // Solo calcular el monto una vez cuando se carga el formulario (ocupación activa)
    if (
      !ocupacion ||
      !tarifaBase ||
      datosInicializados ||
      isOcupacionFinalizada ||
      !playaId
    )
      return

    const minutos = Math.max(
      (Date.now() - new Date(ocupacion.horaIngreso).getTime()) / 60000,
      1
    )
    const sugerido = calculateMontoSugerido(
      ocupacion.modalidadOcupacion,
      minutos,
      tarifaBase
    )
    const rounded = Number(sugerido.toFixed(2))

    form.reset({
      ocupacionId,
      playaId,
      metodoPago: undefined,
      monto: rounded,
      observaciones: ''
    })

    setDatosInicializados(true)
  }, [
    ocupacion,
    tarifaBase,
    datosInicializados,
    form,
    isOcupacionFinalizada,
    playaId,
    ocupacionId
  ])

  useEffect(() => {
    if (formState.errors) {
      Object.entries(formState.errors).forEach(([field, messages]) => {
        if (field === 'general') {
          toast.error('No se pudo finalizar la ocupación', {
            description: messages.join(', ')
          })
        } else {
          form.setError(field as keyof FinalizeOcupacionRequest, {
            message: messages[0]
          })
        }
      })
    }
  }, [formState.errors, form])

  useEffect(() => {
    if (formState.success) {
      toast.success('Ocupación finalizada correctamente', {
        description: 'La plaza volverá a estar disponible en breve.'
      })

      const invalidations: Promise<unknown>[] = [
        queryClient.invalidateQueries({ queryKey: ['ocupaciones'] }),
        queryClient.invalidateQueries({ queryKey: ['ocupacion', ocupacionId] })
      ]
      if (playaId) {
        // Invalidar todas las queries de plazas relacionadas con esta playa
        invalidations.push(
          queryClient.invalidateQueries({
            queryKey: ['plazas', playaId]
          })
        )
      }

      Promise.allSettled(invalidations).finally(() => {
        router.push('/admin/ocupaciones')
      })
    }
  }, [formState.success, queryClient, router, ocupacionId, playaId])

  const metodoSeleccionado = form.watch('metodoPago')

  useEffect(() => {
    if (!metodoSeleccionado || !metodosActivos) return
    const stillActive = metodosActivos.some(
      (item) => item.metodoPago === metodoSeleccionado
    )
    if (!stillActive) {
      form.setError('metodoPago', {
        message: 'Método de pago suspendido'
      })
      toast.error('Método de pago suspendido', {
        description: 'Selecciona otra forma de pago para continuar.'
      })
    }
  }, [metodoSeleccionado, metodosActivos, form])

  const loading =
    ocupacionLoading ||
    metodosLoading ||
    tarifasLoading ||
    !ocupacion ||
    !datosInicializados

  if (ocupacionError) {
    return (
      <Alert variant="destructive" className="max-w-2xl">
        <AlertDescription>
          No se pudo cargar la ocupación solicitada. Intenta nuevamente.
        </AlertDescription>
      </Alert>
    )
  }

  if (loading) {
    return (
      <div className="flex h-[300px] items-center justify-center">
        <Spinner className="h-6 w-6" />
      </div>
    )
  }

  const selectedPlayaMismatch =
    selectedPlaya && selectedPlaya.id !== ocupacion.playaId

  return (
    <div className="bg-card rounded-md border p-6">
      {selectedPlayaMismatch && (
        <Alert variant="default" className="mb-4">
          <AlertDescription>
            Estás finalizando una ocupación de otra playa. Cambia la playa
            seleccionada antes de continuar para mantener la consistencia de
            datos.
          </AlertDescription>
        </Alert>
      )}

      {isOcupacionFinalizada && (
        <Alert variant="default" className="mb-4">
          <AlertDescription>
            Esta ocupación ya está finalizada. Solo puedes modificar el método
            de pago dentro de las 48 horas posteriores a la finalización.
          </AlertDescription>
        </Alert>
      )}

      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-muted-foreground text-sm">Playa</p>
          <p className="text-base font-semibold">{ocupacion.playaNombre}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-sm">Plaza asignada</p>
          <p className="text-base font-semibold">
            {ocupacion.plazaIdentificador}
          </p>
          <p className="text-muted-foreground mt-0.5 text-xs">
            {ocupacion.tipoPlazaNombre}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-sm">Patente</p>
          <p className="text-base font-semibold">{ocupacion.patente}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-sm">Modalidad</p>
          <p className="text-base font-semibold">
            {MODALIDAD_OCUPACION_LABEL[ocupacion.modalidadOcupacion]}
          </p>
          {tarifaBase > 0 && (
            <p className="text-muted-foreground mt-0.5 text-xs">
              Tarifa: {formatCurrency(tarifaBase)}
            </p>
          )}
        </div>
        <div className="col-span-full">
          <div className="bg-accent/50 space-y-3 rounded-lg border p-4">
            <div className="flex items-center gap-2">
              <Timer className="text-primary h-5 w-5" />
              <h3 className="text-base font-semibold">
                Tiempo de estacionamiento
              </h3>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground w-16 text-sm">
                  Inicio:
                </span>
                <span className="text-foreground text-sm font-medium">
                  {new Date(ocupacion.horaIngreso).toLocaleString('es-AR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-muted-foreground w-16 text-sm">
                  Ahora:
                </span>
                <span className="text-foreground text-sm font-medium">
                  {new Date().toLocaleString('es-AR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>

              <div className="flex items-center gap-4 rounded-md">
                <span className="text-sm font-medium">
                  Duración aproximada:
                </span>
                <span className="text-primary text-xl font-bold tabular-nums">
                  {ocupacion.duracionFormateada}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form className="space-y-6" action={formAction}>
          <input type="hidden" name="ocupacionId" value={ocupacionId} />
          <input type="hidden" name="playaId" value={playaId} />

          <FormField
            control={form.control}
            name="metodoPago"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Forma de pago</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value || ''}
                  disabled={pending || metodosLoading}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un método" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {metodosLoading && (
                      <div className="flex items-center justify-center p-2">
                        <Spinner className="h-4 w-4" />
                      </div>
                    )}
                    {metodosActivos?.map((metodo) => (
                      <SelectItem
                        key={metodo.metodoPago}
                        value={metodo.metodoPago}
                      >
                        {METODO_PAGO_LABEL[metodo.metodoPago]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <input
                  type="hidden"
                  name="metodoPago"
                  value={field.value ?? ''}
                />
                <FormMessage />
              </FormItem>
            )}
          />

          <Controller
            control={form.control}
            name="monto"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Monto {isOcupacionFinalizada ? 'cobrado' : 'a cobrar'}
                </FormLabel>
                <div className="border-input bg-muted flex h-9 w-full rounded-md border px-5 py-1 text-sm shadow-xs md:text-sm">
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    {typeof field.value === 'number'
                      ? formatCurrency(field.value)
                      : '$ 0,00'}
                  </span>
                </div>
                <input
                  type="hidden"
                  name="monto"
                  value={String(field.value ?? '')}
                />
                {isOcupacionFinalizada && (
                  <p className="text-muted-foreground mt-1 text-xs">
                    El monto no puede modificarse en ocupaciones finalizadas
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="observaciones"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Observaciones {isOcupacionFinalizada ? '' : '(opcional)'}
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={
                      isOcupacionFinalizada
                        ? 'No hay observaciones'
                        : 'Anota un comentario breve (máx. 280 caracteres)'
                    }
                    {...field}
                    disabled={pending || isOcupacionFinalizada}
                    maxLength={280}
                    readOnly={isOcupacionFinalizada}
                  />
                </FormControl>
                {isOcupacionFinalizada && (
                  <p className="text-muted-foreground mt-1 text-xs">
                    Las observaciones no pueden modificarse en ocupaciones
                    finalizadas
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex flex-wrap items-center gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/admin/ocupaciones')}
              disabled={pending}
            >
              Cancelar
            </Button>
            {/* <Button /*En algún momento esto era útil...*/
            /*
              type="button"
              variant="outline"
              onClick={() =>
                queryClient.invalidateQueries({
                  queryKey: ['ocupacion', ocupacionId]
                })
              }
              disabled={pending}
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Actualizar datos
            </Button> */}
            <Button
              type="submit"
              disabled={pending || loading || !!selectedPlayaMismatch}
            >
              {pending ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  {isOcupacionFinalizada ? 'Actualizando...' : 'Finalizando...'}
                </>
              ) : (
                <>
                  {isOcupacionFinalizada
                    ? 'Actualizar método de pago'
                    : 'Finalizar ocupación'}
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
