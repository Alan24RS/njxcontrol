'use client'

import {
  startTransition,
  useActionState,
  useEffect,
  useMemo,
  useRef
} from 'react'
import { useForm } from 'react-hook-form'

import { useRouter } from 'next/navigation'

import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

import { updateOcupacionAction } from '@/app/admin/ocupaciones/actions'
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
import { OCUPACION_ESTADO } from '@/constants/ocupacionEstado'
import { TIPO_VEHICULO, TIPO_VEHICULO_LABEL } from '@/constants/tipoVehiculo'
import { useGetOcupacionById } from '@/hooks/queries/ocupaciones/getOcupacionById'
import { useGetPlazas } from '@/hooks/queries/plazas/getPlazas'
import { useGetTarifas } from '@/hooks/queries/tarifas/getTarifas'
import {
  MAX_PATENTE_LENGTH,
  UpdateOcupacionRequest,
  updateOcupacionSchema
} from '@/schemas/ocupacion'
import { objectToFormData } from '@/utils/formData'

type FormState = {
  success: boolean
  fields?: Record<string, string>
  errors?: Record<string, string[]>
}

type EditOcupacionFormProps = {
  ocupacionId: string
}

export default function EditOcupacionForm({
  ocupacionId
}: EditOcupacionFormProps) {
  const [formState, formAction, pending] = useActionState(
    updateOcupacionAction,
    {
      success: false
    } as FormState
  )
  const router = useRouter()
  const queryClient = useQueryClient()

  const formRef = useRef<HTMLFormElement>(null)

  // Obtener datos de la ocupación
  const {
    data: ocupacionData,
    isLoading: isLoadingOcupacion,
    error: ocupacionError
  } = useGetOcupacionById(ocupacionId)

  const form = useForm<UpdateOcupacionRequest>({
    resolver: zodResolver(updateOcupacionSchema),
    defaultValues: {
      ocupacionId,
      plazaId: ocupacionData?.data?.plazaId || '',
      patente: ocupacionData?.data?.patente || '',
      tipoVehiculo: ocupacionData?.data?.tipoVehiculo || '',
      modalidadOcupacion:
        ocupacionData?.data?.modalidadOcupacion ||
        MODALIDAD_OCUPACION_ESPORADICA.POR_HORA
    } as UpdateOcupacionRequest
  })

  const { reset } = form

  // Obtener plazas disponibles de la playa actual
  const playaId = ocupacionData?.data?.playaId
  const plazaActualId = ocupacionData?.data?.plazaId
  const { data: plazasData, isLoading: isLoadingPlazas } = useGetPlazas(
    {
      playaId: playaId || '',
      onlyAvailable: true,
      estado: 'ACTIVO',
      page: 1,
      limit: 1000
    },
    {
      enabled: !!playaId
    }
  )

  // Watchear tipo de vehículo y modalidad para validar compatibilidad
  const tipoVehiculoSeleccionado = form.watch('tipoVehiculo')
  const modalidadSeleccionada = form.watch('modalidadOcupacion')
  const plazaSeleccionadaId = form.watch('plazaId')

  // Obtener tarifas para validar compatibilidad plaza-vehículo
  const { data: tarifasResponse } = useGetTarifas(
    {
      playaId,
      tipoVehiculo: tipoVehiculoSeleccionado,
      modalidadOcupacion: modalidadSeleccionada,
      page: 1,
      limit: 100
    },
    {
      enabled: !!(playaId && tipoVehiculoSeleccionado && modalidadSeleccionada)
    }
  )

  // Obtener tipos de plaza compatibles con el vehículo seleccionado
  const tiposPlazaCompatibles = useMemo(() => {
    if (!tarifasResponse?.data) return new Set<number>()
    return new Set(tarifasResponse.data.map((t) => t.tipoPlazaId))
  }, [tarifasResponse])

  // Verificar si la plaza seleccionada es compatible con el tipo de vehículo
  const plazaSeleccionada = useMemo(() => {
    if (!plazaSeleccionadaId || !plazasData?.data) return null
    return plazasData.data.find((p) => p.id === plazaSeleccionadaId)
  }, [plazaSeleccionadaId, plazasData])

  const plazaIncompatible = useMemo(() => {
    if (!tipoVehiculoSeleccionado || !plazaSeleccionada) return false
    return !tiposPlazaCompatibles.has(plazaSeleccionada.tipoPlazaId)
  }, [tipoVehiculoSeleccionado, plazaSeleccionada, tiposPlazaCompatibles])

  // Combinar plaza actual con plazas disponibles y filtrar por compatibilidad
  const plazasParaSelect = useMemo(() => {
    if (!plazasData?.data) return []

    let plazasDisponibles = plazasData.data

    // Si hay tipo de vehículo seleccionado, filtrar por compatibilidad
    if (tipoVehiculoSeleccionado && tiposPlazaCompatibles.size > 0) {
      plazasDisponibles = plazasDisponibles.filter((plaza) =>
        tiposPlazaCompatibles.has(plaza.tipoPlazaId)
      )
    }

    // Si la plaza actual no está en la lista de disponibles, agregarla
    // (para que no desaparezca del select y el usuario pueda ver qué tenía seleccionado)
    if (
      plazaActualId &&
      !plazasDisponibles.some((p) => p.id === plazaActualId)
    ) {
      const plazaActual = {
        id: plazaActualId,
        identificador: ocupacionData?.data?.plazaIdentificador || '',
        tipoPlazaNombre: ocupacionData?.data?.tipoPlazaNombre || 'Sin tipo',
        tipoPlazaId: ocupacionData?.data?.tipoPlazaId || 0,
        estado: 'ACTIVO' as const
      }
      return [plazaActual, ...plazasDisponibles]
    }

    return plazasDisponibles
  }, [
    plazasData,
    plazaActualId,
    ocupacionData,
    tipoVehiculoSeleccionado,
    tiposPlazaCompatibles
  ])

  // Inicializar el formulario con los datos de la ocupación
  useEffect(() => {
    if (ocupacionData?.data) {
      const ocupacion = ocupacionData.data
      const modalidadValida =
        ocupacion.modalidadOcupacion !== MODALIDAD_OCUPACION.ABONO
          ? ocupacion.modalidadOcupacion
          : undefined

      reset({
        ocupacionId,
        plazaId: ocupacion.plazaId || '',
        patente: ocupacion.patente || '',
        tipoVehiculo: ocupacion.tipoVehiculo || undefined,
        modalidadOcupacion: modalidadValida || undefined
      })
    }
  }, [ocupacionData, reset, ocupacionId])

  useEffect(() => {
    const handleResult = async () => {
      if (formState.success) {
        toast.success('Ocupación actualizada correctamente', {
          description: 'Los datos se han actualizado exitosamente'
        })

        // Invalidar la caché asociada para refrescar disponibilidad y listado
        const invalidations = [
          queryClient.invalidateQueries({ queryKey: ['ocupaciones'] }),
          queryClient.invalidateQueries({
            queryKey: ['ocupacion', ocupacionId]
          })
        ]

        if (playaId) {
          // Invalidar todas las queries de plazas relacionadas con esta playa
          invalidations.push(
            queryClient.invalidateQueries({
              queryKey: ['plazas', playaId]
            })
          )
        }

        await Promise.all(invalidations)

        // Navegar a la página de ocupaciones
        router.push('/admin/ocupaciones')
      } else if (formState.errors) {
        Object.entries(formState.errors).forEach(([field, errors]) => {
          if (field === 'general') {
            toast.error('Error al actualizar ocupación', {
              description: errors.join(', ')
            })
          } else {
            form.setError(field as keyof UpdateOcupacionRequest, {
              message: errors[0]
            })
          }
        })
      }
    }

    void handleResult()
  }, [formState, form, router, queryClient, ocupacionId, playaId])

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

  // Mostrar loading mientras carga la ocupación
  if (isLoadingOcupacion) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  // Error al cargar ocupación
  if (ocupacionError || !ocupacionData?.data) {
    return (
      <div className="px-6 sm:px-0">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {ocupacionData?.error ||
              'Error al cargar los datos de la ocupación. Intenta nuevamente.'}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const ocupacion = ocupacionData.data

  // Mostrar loading mientras redirige si está finalizada
  if (ocupacion.estado !== OCUPACION_ESTADO.ACTIVO) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="px-6 sm:px-0">
      <Form {...form}>
        <form ref={formRef} onSubmit={onSubmit} className="max-w-2xl space-y-6">
          {/* Información de la playa (solo lectura) */}
          <div className="bg-muted rounded-lg p-4">
            <h3 className="mb-2 text-sm font-medium">Información actual</h3>
            <div className="text-muted-foreground space-y-1 text-sm">
              <p>
                <span className="font-medium">Playa:</span>{' '}
                {ocupacion.playaNombre}
              </p>
              <p>
                <span className="font-medium">Patente:</span>{' '}
                <span className="font-mono">{ocupacion.patente}</span>
              </p>
            </div>
          </div>

          {/* Selector de Plaza */}
          <FormField
            control={form.control}
            name="plazaId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Plaza de estacionamiento</FormLabel>
                <Select
                  key={field.value || 'empty'}
                  onValueChange={field.onChange}
                  value={field.value || ''}
                  disabled={pending || isLoadingPlazas}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una plaza" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {isLoadingPlazas ? (
                      <SelectItem value="loading" disabled>
                        Cargando plazas...
                      </SelectItem>
                    ) : plazasParaSelect.length === 0 ? (
                      <SelectItem value="empty" disabled>
                        {tipoVehiculoSeleccionado
                          ? 'No hay plazas compatibles con este tipo de vehículo'
                          : 'No hay plazas disponibles'}
                      </SelectItem>
                    ) : (
                      plazasParaSelect.map((plaza) => (
                        <SelectItem key={plaza.id} value={plaza.id}>
                          {plaza.identificador}
                          {' - '}
                          {'tipoPlazaNombre' in plaza
                            ? plaza.tipoPlazaNombre
                            : plaza.tipoPlaza?.nombre}
                          {plaza.id === plazaActualId && ' (Actual)'}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
                {tipoVehiculoSeleccionado ? (
                  <p className="text-muted-foreground text-xs">
                    Solo se muestran plazas disponibles y compatibles con{' '}
                    {TIPO_VEHICULO_LABEL[tipoVehiculoSeleccionado]} y la plaza
                    actual.
                  </p>
                ) : (
                  <p className="text-muted-foreground text-xs">
                    Selecciona primero un tipo de vehículo para filtrar plazas
                  </p>
                )}
              </FormItem>
            )}
          />

          {/* Alerta de incompatibilidad plaza-vehículo */}
          {plazaIncompatible && plazaSeleccionada && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Advertencia:</strong> La plaza seleccionada (
                {plazaSeleccionada.tipoPlaza?.nombre || 'Sin tipo'}) no es
                compatible con el tipo de vehículo{' '}
                {TIPO_VEHICULO_LABEL[tipoVehiculoSeleccionado!]}. No existe
                tarifa configurada para esta combinación.
              </AlertDescription>
            </Alert>
          )}

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
                      // Normalizar en tiempo real: mayúsculas + sin espacios/guiones
                      // Mismo comportamiento que el schema Zod para consistencia
                      const value = e.target.value
                        .toUpperCase()
                        .replace(/[\s-]/g, '')
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

          {/* Tipo de vehículo */}
          <FormField
            control={form.control}
            name="tipoVehiculo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de vehículo</FormLabel>
                <Select
                  key={field.value || 'empty'}
                  onValueChange={field.onChange}
                  value={field.value || ''}
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
                  key={field.value || 'empty'}
                  onValueChange={field.onChange}
                  value={field.value || ''}
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
            <Button type="submit" disabled={pending || plazaIncompatible}>
              {pending ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Guardando...
                </>
              ) : (
                <>
                  {/* <Save className="mr-2 h-4 w-4" /> */}
                  Guardar cambios
                </>
              )}
            </Button>
          </div>
          {plazaIncompatible && (
            <p className="text-destructive text-sm">
              No puedes guardar mientras haya incompatibilidad entre el tipo de
              vehículo y la plaza seleccionada.
            </p>
          )}
        </form>
      </Form>
    </div>
  )
}
