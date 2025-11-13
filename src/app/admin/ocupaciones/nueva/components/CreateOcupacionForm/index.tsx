'use client'

import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState
} from 'react'
import { useForm } from 'react-hook-form'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

import { createOcupacionAction } from '@/app/admin/ocupaciones/actions'
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
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui'
import { Spinner } from '@/components/ui/spinner'
import {
  MODALIDAD_OCUPACION,
  MODALIDAD_OCUPACION_ESPORADICA,
  MODALIDAD_OCUPACION_LABEL
} from '@/constants/modalidadOcupacion'
import { TIPO_VEHICULO, TIPO_VEHICULO_LABEL } from '@/constants/tipoVehiculo'
import { useGetPlazas } from '@/hooks/queries/plazas/getPlazas'
import { useGetTarifas } from '@/hooks/queries/tarifas/getTarifas'
import useDebounce from '@/hooks/useDebounce'
import {
  CreateOcupacionRequest,
  createOcupacionSchema,
  MAX_PATENTE_LENGTH
} from '@/schemas/ocupacion'
import type { DeudaPorPatente } from '@/services/abonos/types'
import { useSelectedPlaya } from '@/stores'
import { objectToFormData } from '@/utils/formData'

type FormState = {
  success: boolean
  fields?: Record<string, string>
  errors?: Record<string, string[]>
}

export default function CreateOcupacionForm() {
  const [formState, formAction, pending] = useActionState(
    createOcupacionAction,
    {
      success: false
    } as FormState
  )
  const router = useRouter()
  const queryClient = useQueryClient()

  const { selectedPlaya, isLoading: isLoadingPlaya } = useSelectedPlaya()

  const formRef = useRef<HTMLFormElement>(null)
  const [deudaInfo, setDeudaInfo] = useState<DeudaPorPatente | null>(null)
  const [verificandoDeuda, setVerificandoDeuda] = useState(false)

  const form = useForm<CreateOcupacionRequest>({
    resolver: zodResolver(createOcupacionSchema),
    mode: 'onSubmit', // Solo validar cuando se hace submit
    defaultValues: {
      playaId: selectedPlaya?.id,
      plazaId: '' as any, // String vacío temporal hasta que se seleccione
      patente: '',
      tipoVehiculo: undefined,
      modalidadOcupacion: MODALIDAD_OCUPACION.POR_HORA,
      numeroPago: undefined,
      ...(formState?.fields ?? {})
    }
  })

  // Obtener plazas disponibles de la playa seleccionada
  const {
    data: plazasData,
    isLoading: isLoadingPlazas,
    error: plazasError
  } = useGetPlazas(
    {
      playaId: selectedPlaya?.id || '',
      onlyAvailable: true,
      estado: 'ACTIVO',
      page: 1,
      limit: 1000
    },
    {
      enabled: !!selectedPlaya?.id
    }
  )

  const plazasDisponibles = plazasData?.data ?? []

  // Watchear tipo de vehículo y modalidad para filtrar plazas
  const tipoVehiculoSeleccionado = form.watch('tipoVehiculo')
  const modalidadSeleccionada = form.watch('modalidadOcupacion')

  // Obtener tarifas para filtrar plazas compatibles
  const { data: tarifasResponse } = useGetTarifas(
    {
      playaId: selectedPlaya?.id,
      tipoVehiculo: tipoVehiculoSeleccionado,
      modalidadOcupacion: modalidadSeleccionada,
      page: 1,
      limit: 100
    },
    {
      enabled: !!(
        selectedPlaya?.id &&
        tipoVehiculoSeleccionado &&
        modalidadSeleccionada
      )
    }
  )

  // Filtrar plazas que tienen tarifas configuradas para el tipo de vehículo seleccionado
  const plazasCompatibles =
    tipoVehiculoSeleccionado && tarifasResponse?.data
      ? (() => {
          const tiposPlazaConTarifa = new Set(
            tarifasResponse.data.map((t) => t.tipoPlazaId)
          )
          return plazasDisponibles.filter((plaza) =>
            tiposPlazaConTarifa.has(plaza.tipoPlazaId)
          )
        })()
      : plazasDisponibles

  // Actualizar playaId cuando cambie la playa seleccionada
  useEffect(() => {
    if (selectedPlaya?.id) {
      form.setValue('playaId', selectedPlaya.id)
    }
  }, [selectedPlaya, form])

  const watchPatente = form.watch('patente')
  const debouncedPatente = useDebounce(watchPatente, 500)

  useEffect(() => {
    async function verificarDeuda() {
      if (
        !debouncedPatente ||
        debouncedPatente.length < 6 ||
        !selectedPlaya?.id
      ) {
        setDeudaInfo(null)
        return
      }

      setVerificandoDeuda(true)
      try {
        const { verificarDeudaPorPatenteAction } = await import(
          '@/app/admin/abonos/actions'
        )
        const result = await verificarDeudaPorPatenteAction(
          debouncedPatente,
          selectedPlaya.id
        )

        if (result.data) {
          setDeudaInfo(result.data)
        } else {
          setDeudaInfo(null)
        }
      } catch (error) {
        console.error('Error verificando deuda:', error)
        setDeudaInfo(null)
      } finally {
        setVerificandoDeuda(false)
      }
    }

    verificarDeuda()
  }, [debouncedPatente, selectedPlaya?.id])

  useEffect(() => {
    const handleEffect = async () => {
      if (formState.success) {
        toast.success('Ocupación registrada correctamente', {
          description: 'El vehículo ha ingresado a la playa'
        })

        // Invalidar la caché y esperar a que se complete antes de navegar
        const invalidations = [
          queryClient.invalidateQueries({ queryKey: ['ocupaciones'] })
        ]

        if (selectedPlaya?.id) {
          // Invalidar todas las queries de plazas relacionadas con esta playa
          invalidations.push(
            queryClient.invalidateQueries({
              queryKey: ['plazas', selectedPlaya.id]
            })
          )
        }

        await Promise.all(invalidations)

        // Navegar a la página de ocupaciones
        router.push('/admin/ocupaciones')
      } else if (formState.errors) {
        Object.entries(formState.errors).forEach(([field, errors]) => {
          if (field === 'general') {
            toast.error('Error al registrar ocupación', {
              description: errors.join(', ')
            })
          } else {
            form.setError(field as keyof CreateOcupacionRequest, {
              message: errors[0]
            })
          }
        })
      }
    }

    void handleEffect()
  }, [formState, form, router, queryClient, selectedPlaya?.id])

  const onSubmit = form.handleSubmit((data) => {
    startTransition(() => {
      // Convertir los datos validados del form a FormData usando la utilidad
      // React Hook Form ya validó los datos con Zod, así que podemos pasarlos directamente
      const formData = objectToFormData(data, {
        skipNull: true // Omitir campos null/undefined
      })

      formAction(formData)
    })
  })

  // Mostrar loading mientras carga la playa
  if (isLoadingPlaya) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  // Validar que haya una playa seleccionada
  if (!selectedPlaya) {
    return (
      <div className="px-6 sm:px-0">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Debes seleccionar una playa antes de registrar una ocupación.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="px-6 sm:px-0">
      <Form {...form}>
        <form ref={formRef} onSubmit={onSubmit} className="max-w-2xl space-y-6">
          {/* Patente */}
          <FormField
            control={form.control}
            name="patente"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Patente del vehículo</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ej: ABC123 o AA123BB"
                    {...field}
                    onChange={(e) => {
                      // Normalizar en tiempo real: convertir a mayúsculas
                      const value = e.target.value.toUpperCase()
                      field.onChange(value)
                    }}
                    maxLength={MAX_PATENTE_LENGTH}
                    disabled={pending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {verificandoDeuda && (
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Spinner className="h-4 w-4" />
              <span>Verificando deuda...</span>
            </div>
          )}

          {deudaInfo && deudaInfo.tieneAbono && deudaInfo.tieneDeuda && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <p className="mb-2 font-semibold">
                  ⚠️ ATENCIÓN: Este abonado tiene boletas vencidas
                </p>
                <div className="space-y-1 text-sm">
                  <p>
                    <strong>Abonado:</strong> {deudaInfo.abonadoNombre}{' '}
                    {deudaInfo.abonadoApellido}
                  </p>
                  <p>
                    <strong>Deuda total:</strong> $
                    {deudaInfo.deudaTotal.toLocaleString()}
                  </p>
                  <p>
                    <strong>Boletas vencidas:</strong>{' '}
                    {deudaInfo.boletasVencidas}
                  </p>
                  <Link
                    href={`/admin/abonados/${deudaInfo.abonadoId}`}
                    className="text-primary mt-2 inline-flex items-center gap-1 hover:underline"
                  >
                    Ver detalle de boletas <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {deudaInfo && deudaInfo.tieneAbono && !deudaInfo.tieneDeuda && (
            <Alert>
              <AlertDescription>
                <p className="text-sm">
                  ✅ Este vehículo tiene un abono activo y está al día con los
                  pagos
                </p>
              </AlertDescription>
            </Alert>
          )}

          {/* Tipo de vehículo */}
          <FormField
            control={form.control}
            name="tipoVehiculo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de vehículo</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={pending}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el tipo de vehículo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(TIPO_VEHICULO).map(([_key, value]) => (
                      <SelectItem key={value} value={value}>
                        {
                          TIPO_VEHICULO_LABEL[
                            value as keyof typeof TIPO_VEHICULO_LABEL
                          ]
                        }
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Modalidad de ocupación */}
          <FormField
            control={form.control}
            name="modalidadOcupacion"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Modalidad de cobro</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={pending}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona la modalidad" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(MODALIDAD_OCUPACION_ESPORADICA).map(
                      ([_key, value]) => (
                        <SelectItem key={value} value={value}>
                          {
                            MODALIDAD_OCUPACION_LABEL[
                              value as keyof typeof MODALIDAD_OCUPACION_LABEL
                            ]
                          }
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Plaza / Espacio */}
          <FormField
            control={form.control}
            name="plazaId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Espacio disponible</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={
                    pending || isLoadingPlazas || !tipoVehiculoSeleccionado
                  }
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un espacio libre" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {isLoadingPlazas && (
                      <div className="flex items-center justify-center p-2">
                        <Spinner className="h-4 w-4" />
                      </div>
                    )}
                    {!isLoadingPlazas && !tipoVehiculoSeleccionado && (
                      <div className="text-muted-foreground p-2 text-center text-sm">
                        Selecciona primero un tipo de vehículo
                      </div>
                    )}
                    {!isLoadingPlazas &&
                      tipoVehiculoSeleccionado &&
                      plazasCompatibles.length === 0 && (
                        <div className="text-muted-foreground p-2 text-center text-sm">
                          No hay espacios disponibles para este tipo de vehículo
                        </div>
                      )}
                    {plazasCompatibles.map((plaza) => (
                      <SelectItem key={plaza.id} value={plaza.id}>
                        Plaza {plaza.identificador} - {plaza.tipoPlaza?.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {tipoVehiculoSeleccionado && (
                  <p className="text-muted-foreground text-sm">
                    Solo se muestran plazas disponibles y compatibles para el
                    tipo de vehículo{' '}
                    {
                      TIPO_VEHICULO_LABEL[
                        tipoVehiculoSeleccionado as keyof typeof TIPO_VEHICULO_LABEL
                      ]
                    }
                  </p>
                )}
                {!tipoVehiculoSeleccionado && (
                  <p className="text-muted-foreground text-sm">
                    Selecciona primero un tipo de vehículo para filtrar plazas
                  </p>
                )}
                {plazasError && (
                  <p className="text-destructive text-sm">
                    Error al cargar espacios disponibles
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Alerta de plazas no disponibles */}
          {!isLoadingPlazas &&
            tipoVehiculoSeleccionado &&
            plazasCompatibles.length === 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  No hay espacios disponibles para el tipo de vehículo
                  seleccionado. Verifica las tarifas configuradas para esta
                  playa.
                </AlertDescription>
              </Alert>
            )}

          {/* Botones de acción */}
          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/admin/ocupaciones')}
              disabled={pending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={
                pending ||
                !tipoVehiculoSeleccionado ||
                plazasCompatibles.length === 0
              }
            >
              {pending ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Registrando...
                </>
              ) : (
                <>Registrar ingreso</>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
