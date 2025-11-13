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

import { useRouter } from 'next/navigation'

import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CurrencyInput,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui'
import { MODALIDAD_OCUPACION_LABEL } from '@/constants/modalidadOcupacion'
import { ROL, Role } from '@/constants/rol'
import { TIPO_VEHICULO_LABEL } from '@/constants/tipoVehiculo'
import { type UpdateTarifaRequest, updateTarifaSchema } from '@/schemas/tarifa'
import type { Tarifa } from '@/services/tarifas/types'
import { formatCurrency } from '@/utils/formatters'

import { updateTarifaAction } from '../actions'

type FormState = {
  success: boolean
  fields?: Record<string, string>
  errors?: Record<string, string[]>
}

interface TarifaDetailFormProps {
  tarifa: Tarifa
  playaId: string
  tipoPlazaId: number
  modalidadOcupacion: string
  tipoVehiculo: string
  roles: Role[]
}

export default function TarifaDetailForm({
  tarifa,
  playaId,
  tipoPlazaId,
  modalidadOcupacion,
  tipoVehiculo,
  roles
}: TarifaDetailFormProps) {
  const isDueno = roles.includes(ROL.DUENO)

  const boundUpdateTarifaAction = updateTarifaAction.bind(
    null,
    playaId,
    tipoPlazaId,
    modalidadOcupacion,
    tipoVehiculo
  )

  const [formState, formAction, pending] = useActionState(
    boundUpdateTarifaAction,
    {
      success: false
    } as FormState
  )

  const router = useRouter()
  const queryClient = useQueryClient()
  const [hasChanges, setHasChanges] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const processedSuccessRef = useRef(false)

  const defaultValues: UpdateTarifaRequest = useMemo(
    () => ({
      precioBase: tarifa.precioBase
    }),
    [tarifa.precioBase]
  )

  const form = useForm<UpdateTarifaRequest>({
    resolver: zodResolver(updateTarifaSchema),
    defaultValues,
    mode: 'onChange'
  })

  const { control, handleSubmit, reset, watch } = form
  const watchedValues = watch()

  useEffect(() => {
    const hasFormChanges = watchedValues.precioBase !== defaultValues.precioBase
    setHasChanges(hasFormChanges)
  }, [watchedValues, defaultValues])

  useEffect(() => {
    if (formState.success && !processedSuccessRef.current) {
      processedSuccessRef.current = true
      queryClient.invalidateQueries({
        queryKey: ['tarifas']
      })
      toast.success('Tarifa actualizada correctamente')
      router.push('/admin/tarifas')
    } else if (formState.errors) {
      Object.entries(formState.errors).forEach(([field, errors]) => {
        if (field === 'general') {
          toast.error('Error al actualizar la tarifa', {
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
  }, [formState.success, formState.errors, router, queryClient])

  const handleReset = () => {
    reset(defaultValues)
    setHasChanges(false)
  }

  const modalidadLabel =
    MODALIDAD_OCUPACION_LABEL[
      modalidadOcupacion as keyof typeof MODALIDAD_OCUPACION_LABEL
    ]
  const vehiculoLabel =
    TIPO_VEHICULO_LABEL[tipoVehiculo as keyof typeof TIPO_VEHICULO_LABEL]

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Información de la Tarifa</CardTitle>
            <CardDescription>
              Detalles de la configuración de la tarifa
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-muted-foreground text-sm font-medium">
                Tipo de Plaza
              </label>
              <div className="mt-1">
                <p className="font-medium">{tarifa.tipoPlaza.nombre}</p>
                {tarifa.tipoPlaza.descripcion && (
                  <p className="text-muted-foreground text-sm">
                    {tarifa.tipoPlaza.descripcion}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="text-muted-foreground text-sm font-medium">
                Modalidad de Ocupación
              </label>
              <div className="mt-1">
                <Badge variant="secondary">{modalidadLabel}</Badge>
              </div>
            </div>

            <div>
              <label className="text-muted-foreground text-sm font-medium">
                Tipo de Vehículo
              </label>
              <div className="mt-1">
                <Badge variant="outline">{vehiculoLabel}</Badge>
              </div>
            </div>

            <div>
              <label className="text-muted-foreground text-sm font-medium">
                Precio Base Actual
              </label>
              <div className="mt-1">
                <p className="font-mono text-lg font-semibold">
                  {formatCurrency(tarifa.precioBase)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <label className="text-muted-foreground">
                  Fecha de Creación
                </label>
                <p className="font-medium">
                  {tarifa.fechaCreacion.toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <div>
                <label className="text-muted-foreground">
                  Última Modificación
                </label>
                <p className="font-medium">
                  {tarifa.fechaModificacion.toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Editar Tarifa</CardTitle>
            <CardDescription>
              Modifica el precio base de la tarifa
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                ref={formRef}
                action={formAction}
                onSubmit={(evt) => {
                  evt.preventDefault()
                  handleSubmit(() => {
                    startTransition(() => {
                      formAction(new FormData(formRef.current!))
                    })
                  })(evt)
                }}
                className="space-y-6"
              >
                <FormField
                  control={control}
                  name="precioBase"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Precio Base</FormLabel>
                      <FormControl>
                        <div>
                          <CurrencyInput
                            value={field.value}
                            onValueChange={field.onChange}
                            placeholder="$ 0,00"
                            disabled={!isDueno}
                          />
                          <input
                            type="hidden"
                            name="precioBase"
                            value={field.value ?? ''}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex flex-wrap gap-3">
                  {isDueno && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleReset}
                      disabled={pending || !hasChanges}
                    >
                      Deshacer cambios
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/admin/tarifas')}
                    disabled={pending}
                  >
                    {isDueno ? 'Cancelar' : 'Volver'}
                  </Button>
                  {isDueno && (
                    <Button
                      type="submit"
                      disabled={!hasChanges || pending}
                      loading={pending}
                    >
                      Guardar Cambios
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
