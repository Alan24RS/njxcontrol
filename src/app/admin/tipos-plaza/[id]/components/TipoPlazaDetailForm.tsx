'use client'

import {
  startTransition,
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'
import type { Resolver } from 'react-hook-form'
import { useForm } from 'react-hook-form'

import { useRouter } from 'next/navigation'

import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import {
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Textarea
} from '@/components/ui'
import ComboboxWithSearch from '@/components/ui/ComboboxSearch'
import { ROL, Role } from '@/constants/rol'
import { useGetCaracteristicas } from '@/hooks/queries/caracteristicas/getCaracteristicas'
import {
  type UpdateTipoPlazaRequest,
  updateTipoPlazaSchema
} from '@/schemas/tipo-plaza'
import { getCaracteristicas } from '@/services/caracteristicas'
import { type TipoPlaza } from '@/services/tipos-plaza'

import { updateTipoPlazaAction } from '../actions'

type FormState = {
  success: boolean
  fields?: Record<string, string>
  errors?: Record<string, string[]>
}

type TipoPlazaDetailFormProps = {
  tipoPlaza: TipoPlaza
  roles: Role[]
}

export default function TipoPlazaDetailForm({
  tipoPlaza,
  roles
}: TipoPlazaDetailFormProps) {
  const isDueno = roles.includes(ROL.DUENO)
  const [formState, formAction, pending] = useActionState(
    updateTipoPlazaAction,
    {
      success: false
    } as FormState
  )
  const router = useRouter()
  const queryClient = useQueryClient()
  const [hasChanges, setHasChanges] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const processedSuccessRef = useRef(false)

  const { data: caracteristicasResult } = useGetCaracteristicas()
  const caracteristicas = caracteristicasResult?.data || []

  const defaultValues: UpdateTipoPlazaRequest = useMemo(
    () => ({
      id: tipoPlaza.id,
      nombre: tipoPlaza.nombre,
      descripcion: tipoPlaza.descripcion || '',
      caracteristicas: tipoPlaza.caracteristicas.map((c) => c.id)
    }),
    [tipoPlaza]
  )

  const form = useForm<UpdateTipoPlazaRequest>({
    resolver: zodResolver(
      updateTipoPlazaSchema
    ) as unknown as Resolver<UpdateTipoPlazaRequest>,
    defaultValues,
    mode: 'onChange'
  })

  const { control, handleSubmit, reset, watch, trigger } = form
  const watchedValues = watch()

  useEffect(() => {
    const hasFormChanges = Object.keys(defaultValues).some((key) => {
      const currentValue = watchedValues[key as keyof UpdateTipoPlazaRequest]
      const defaultValue = defaultValues[key as keyof UpdateTipoPlazaRequest]

      if (key === 'caracteristicas') {
        const current = Array.isArray(currentValue) ? currentValue.sort() : []
        const defaultVal = Array.isArray(defaultValue)
          ? defaultValue.sort()
          : []
        return JSON.stringify(current) !== JSON.stringify(defaultVal)
      }

      return currentValue !== defaultValue
    })
    setHasChanges(hasFormChanges)
  }, [watchedValues, defaultValues])

  useEffect(() => {
    if (formState.success && !processedSuccessRef.current) {
      processedSuccessRef.current = true
      toast.success('Tipo de plaza actualizado correctamente')
      queryClient.invalidateQueries({ queryKey: ['tipos-plaza'] })
      router.push('/admin/tipos-plaza')
    }
  }, [formState.success, router, queryClient])

  useEffect(() => {
    if (formState.errors) {
      Object.entries(formState.errors).forEach(([field, messages]) => {
        if (field === 'general') {
          messages.forEach((message) => toast.error(message))
        }
      })
    }
  }, [formState.errors])

  const onSubmit = (data: UpdateTipoPlazaRequest) => {
    processedSuccessRef.current = false

    const formData = new FormData()
    formData.append('id', data.id.toString())
    formData.append('nombre', data.nombre)
    formData.append('descripcion', data.descripcion || '')

    data.caracteristicas.forEach((caracteristicaId) => {
      formData.append('caracteristicas', caracteristicaId.toString())
    })

    startTransition(() => {
      formAction(formData)
    })
  }

  const handleReset = () => {
    reset(defaultValues)
    setHasChanges(false)
  }

  const caracteristicasSelected = watch('caracteristicas')

  return (
    <Form {...form}>
      <form
        ref={formRef}
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6"
      >
        <input type="hidden" name="id" value={tipoPlaza.id} />

        {/* Hidden fields para las características seleccionadas */}
        {caracteristicasSelected?.map((caracteristicaId) => (
          <input
            key={`caracteristica-${caracteristicaId}`}
            type="hidden"
            name="caracteristicas"
            value={caracteristicaId}
          />
        ))}

        <FormField
          control={control}
          name="nombre"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ej: Estándar, Premium, VIP"
                  {...field}
                  disabled={!isDueno}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="descripcion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descripción opcional del tipo de plaza"
                  className="resize-none"
                  rows={3}
                  {...field}
                  disabled={!isDueno}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="caracteristicas"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>Características</FormLabel>
              <FormControl>
                <ComboboxWithSearch
                  {...field}
                  onChange={(selectedOptions) => {
                    const ids = Array.isArray(selectedOptions)
                      ? selectedOptions.map((option) => option.id)
                      : selectedOptions?.id || []
                    field.onChange(ids)
                    trigger('caracteristicas')
                  }}
                  value={
                    Array.isArray(field.value)
                      ? caracteristicas.filter((char) =>
                          field.value.includes(char.id)
                        )
                      : []
                  }
                  error={!!fieldState.error}
                  queryFn={getCaracteristicas}
                  initialData={caracteristicas}
                  placeholder="Selecciona las características"
                  multiple
                  fields={{
                    label: 'nombre',
                    value: 'id'
                  }}
                  disabled={!isDueno}
                />
              </FormControl>
              <FormMessage />
              <p className="text-muted-foreground mt-1 text-sm">
                En caso de no seleccionar característica/s, el tipo de plaza se
                considerará estándar (sin servicios adicionales).
              </p>
            </FormItem>
          )}
        />

        <div className="flex flex-col gap-3 pt-6 sm:flex-row">
          {isDueno && (
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={!hasChanges || pending}
              className="w-full sm:w-auto"
            >
              Deshacer cambios
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/tipos-plaza')}
          >
            {isDueno ? 'Cancelar' : 'Volver'}
          </Button>
          {isDueno && (
            <Button
              type="submit"
              disabled={!hasChanges || pending}
              className="w-full sm:w-auto"
              loading={pending}
            >
              Guardar
            </Button>
          )}
        </div>
      </form>
    </Form>
  )
}
