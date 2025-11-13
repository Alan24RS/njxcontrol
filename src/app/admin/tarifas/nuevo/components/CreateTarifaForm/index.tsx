'use client'

import { startTransition, useActionState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'

import { useRouter } from 'next/navigation'

import { Link } from 'next-view-transitions'

import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

import { createTarifaAction } from '@/app/admin/tarifas/actions'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  CurrencyInput,
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
import { MODALIDAD_OCUPACION_LABEL } from '@/constants/modalidadOcupacion'
import { TIPO_VEHICULO_LABEL } from '@/constants/tipoVehiculo'
import { useGetModalidadesOcupacion } from '@/hooks/queries/modalidades-ocupacion/getModalidadesOcupacion'
import { useGetTiposPlaza } from '@/hooks/queries/tipos-plaza/getTiposPlaza'
import { useGetTiposVehiculo } from '@/hooks/queries/tipos-vehiculo/getTiposVehiculo'
import { CreateTarifaRequest, createTarifaSchema } from '@/schemas/tarifa'
import { useSelectedPlaya } from '@/stores'

type FormState = {
  success: boolean
  fields?: Record<string, string>
  errors?: Record<string, string[]>
}

export default function CreateTarifaForm() {
  const [formState, formAction, pending] = useActionState(createTarifaAction, {
    success: false
  } as FormState)

  const router = useRouter()
  const queryClient = useQueryClient()

  const { selectedPlaya, isLoading } = useSelectedPlaya()

  const formRef = useRef<HTMLFormElement>(null)

  const form = useForm<CreateTarifaRequest>({
    resolver: zodResolver(createTarifaSchema),
    defaultValues: {
      playaId: selectedPlaya?.id || '',
      tipoPlazaId: 0,
      modalidadOcupacion: '',
      tipoVehiculo: '',
      precioBase: undefined,
      ...(formState?.fields ?? {})
    }
  })

  const { data: tiposPlazaResult, isLoading: isLoadingTiposPlaza } =
    useGetTiposPlaza(
      {
        playaId: selectedPlaya?.id || '',
        page: 1,
        limit: 100
      },
      {
        enabled: !!selectedPlaya?.id
      }
    )

  const { data: modalidadesResult, isLoading: isLoadingModalidades } =
    useGetModalidadesOcupacion(
      {
        playaId: selectedPlaya?.id || '',
        page: 1,
        limit: 100
      },
      {
        enabled: !!selectedPlaya?.id
      }
    )

  const { data: tiposVehiculoResult, isLoading: isLoadingTiposVehiculo } =
    useGetTiposVehiculo(
      {
        playaId: selectedPlaya?.id || ''
      },
      {
        enabled: !!selectedPlaya?.id
      }
    )

  useEffect(() => {
    if (formState.success) {
      // Invalidar las queries de tarifas para refrescar la tabla
      queryClient.invalidateQueries({
        queryKey: ['tarifas']
      })
      toast.success('Tarifa creada correctamente')
      router.push('/admin/tarifas')
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
  }, [formState, router, queryClient])

  const { control, handleSubmit, setValue } = form

  useEffect(() => {
    if (selectedPlaya?.id) {
      setValue('playaId', selectedPlaya?.id)
    }
  }, [selectedPlaya, setValue])

  // Verificar si está cargando la playa o cualquiera de las consultas
  const isLoadingData =
    isLoading ||
    isLoadingTiposPlaza ||
    isLoadingModalidades ||
    isLoadingTiposVehiculo

  if (!selectedPlaya || isLoadingData) {
    return (
      <div className="flex w-full grow flex-col items-center justify-center space-y-4 p-8">
        <Spinner />
      </div>
    )
  }

  const tiposPlaza = tiposPlazaResult?.data || []
  const modalidadesActivas =
    modalidadesResult?.data?.filter((m) => m.estado === 'ACTIVO') || []
  const tiposVehiculoActivos =
    tiposVehiculoResult?.data?.filter((tv) => tv.estado === 'ACTIVO') || []

  // Verificar si faltan entidades requeridas
  const missingEntities = []
  if (tiposPlaza.length === 0) {
    missingEntities.push({
      name: 'Un tipo de plaza',
      link: '/admin/tipos-plaza/nuevo'
    })
  }
  if (modalidadesActivas.length === 0) {
    missingEntities.push({
      name: 'Una modalidad de ocupación',
      link: '/admin/modalidades-ocupacion'
    })
  }
  if (tiposVehiculoActivos.length === 0) {
    missingEntities.push({
      name: 'Un tipo de vehículo',
      link: '/admin/tipos-vehiculo'
    })
  }

  const canCreateTarifa = missingEntities.length === 0

  // Si faltan entidades, mostrar mensaje de error
  if (!canCreateTarifa) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>No se puede crear una tarifa</AlertTitle>
          <AlertDescription>
            Para crear una tarifa, la playa debe tener configurado al menos:
            <ul className="mt-2 list-inside list-disc space-y-1">
              {missingEntities.map((entity, index) => (
                <li key={index} className="flex items-center gap-2">
                  <span>{entity.name}</span>
                  <Link
                    href={entity.link}
                    className="inline-flex items-center gap-1 text-sm underline hover:no-underline"
                  >
                    Crear <ExternalLink className="h-3 w-3" />
                  </Link>
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <Form {...form}>
      <form
        ref={formRef}
        onSubmit={(evt) => {
          evt.preventDefault()
          handleSubmit((data) => {
            startTransition(() => {
              const formData = new FormData()
              formData.append('playaId', selectedPlaya.id)
              formData.append('tipoPlazaId', data.tipoPlazaId.toString())
              formData.append('modalidadOcupacion', data.modalidadOcupacion)
              formData.append('tipoVehiculo', data.tipoVehiculo)
              formData.append('precioBase', data.precioBase?.toString() || '')
              formAction(formData)
            })
          })(evt)
        }}
        className="space-y-6"
      >
        <FormItem>
          <FormLabel>Playa</FormLabel>
          <FormControl>
            <Input
              name="playa-display"
              value={selectedPlaya.nombre || selectedPlaya.direccion}
              disabled
              className="bg-muted"
            />
          </FormControl>
          <p className="text-muted-foreground text-sm">
            La playa se selecciona desde el panel lateral
          </p>
        </FormItem>

        <FormField
          control={control}
          name="tipoPlazaId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de plaza</FormLabel>
              <Select
                name="tipoPlazaId"
                onValueChange={(value) => field.onChange(Number(value))}
                value={field.value > 0 ? field.value.toString() : ''}
              >
                <FormControl>
                  <SelectTrigger name={field.name}>
                    <SelectValue placeholder="Selecciona un tipo de plaza" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {tiposPlaza.map((tipo) => (
                    <SelectItem key={tipo.id} value={tipo.id.toString()}>
                      {tipo.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="modalidadOcupacion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Modalidad de ocupación</FormLabel>
              <Select
                name="modalidadOcupacion"
                onValueChange={field.onChange}
                value={field.value || ''}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una modalidad" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {modalidadesActivas.map((modalidad) => (
                    <SelectItem
                      key={modalidad.modalidadOcupacion}
                      value={modalidad.modalidadOcupacion}
                    >
                      {
                        MODALIDAD_OCUPACION_LABEL[
                          modalidad.modalidadOcupacion as keyof typeof MODALIDAD_OCUPACION_LABEL
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

        <FormField
          control={control}
          name="tipoVehiculo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de vehículo</FormLabel>
              <Select
                name="tipoVehiculo"
                onValueChange={field.onChange}
                value={field.value || ''}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un tipo de vehículo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {tiposVehiculoActivos.map((tipoVehiculo) => (
                    <SelectItem
                      key={tipoVehiculo.tipoVehiculo}
                      value={tipoVehiculo.tipoVehiculo}
                    >
                      {
                        TIPO_VEHICULO_LABEL[
                          tipoVehiculo.tipoVehiculo as keyof typeof TIPO_VEHICULO_LABEL
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

        <FormField
          control={control}
          name="precioBase"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Precio base</FormLabel>
              <FormControl>
                <CurrencyInput
                  name="precioBase"
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder="$ 0,00"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/tarifas')}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={pending} loading={pending}>
            Crear tarifa
          </Button>
        </div>
      </form>
    </Form>
  )
}
