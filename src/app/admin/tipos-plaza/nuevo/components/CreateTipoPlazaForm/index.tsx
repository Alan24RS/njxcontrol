'use client'

import { startTransition, useActionState, useEffect, useRef } from 'react'
import type { Resolver } from 'react-hook-form'
import { useForm } from 'react-hook-form'

import { useRouter } from 'next/navigation'

import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { createTipoPlazaAction } from '@/app/admin/tipos-plaza/actions'
import {
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input
} from '@/components/ui'
import ComboboxWithSearch from '@/components/ui/ComboboxSearch'
import { Spinner } from '@/components/ui/spinner'
import {
  CreateTipoPlazaRequest,
  createTipoPlazaSchema
} from '@/schemas/tipo-plaza'
import { getCaracteristicas } from '@/services/caracteristicas'
import type { Caracteristica } from '@/services/caracteristicas/types'
import { useSelectedPlaya } from '@/stores'

type FormState = {
  success: boolean
  fields?: Record<string, string>
  errors?: Record<string, string[]>
}

export default function CreateTipoPlazaForm({
  caracteristicas
}: {
  caracteristicas: Caracteristica[]
}) {
  const [formState, formAction, pending] = useActionState(
    createTipoPlazaAction,
    {
      success: false
    } as FormState
  )
  const router = useRouter()
  const queryClient = useQueryClient()

  const { selectedPlaya, isLoading } = useSelectedPlaya()

  const formRef = useRef<HTMLFormElement>(null)

  const form = useForm<CreateTipoPlazaRequest>({
    resolver: zodResolver(
      createTipoPlazaSchema
    ) as unknown as Resolver<CreateTipoPlazaRequest>,
    defaultValues: {
      playaId: selectedPlaya?.id,
      nombre: '',
      descripcion: '',
      caracteristicas: []
    }
  })

  useEffect(() => {
    if (formState.success) {
      // Invalidar las queries de tipos de plaza para refrescar la tabla
      queryClient.invalidateQueries({
        queryKey: ['tipos-plaza']
      })
      toast.success('Tipo de plaza creado correctamente')
      // Invalidar cache de tipos-plaza para que la lista se actualice
      queryClient.invalidateQueries({ queryKey: ['tipos-plaza'] })
      router.push('/admin/tipos-plaza')
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

  const { control, handleSubmit, trigger, setValue, watch } = form

  useEffect(() => {
    if (selectedPlaya?.id) {
      setValue('playaId', selectedPlaya?.id)
    }
  }, [selectedPlaya, setValue])

  if (!selectedPlaya || isLoading) {
    return (
      <div className="flex w-full grow flex-col items-center justify-center space-y-4 p-8">
        <Spinner />
      </div>
    )
  }

  const caracteristicasSelected = watch('caracteristicas')

  return (
    <Form {...form}>
      <form
        ref={formRef}
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
        {/* Hidden field para el ID de la playa */}
        <input type="hidden" name="playaId" value={selectedPlaya.id} />

        {/* Hidden fields para las características seleccionadas */}
        {caracteristicasSelected?.map((caracteristicaId) => (
          <input
            key={`caracteristica-${caracteristicaId}`}
            type="hidden"
            name="caracteristicas"
            value={caracteristicaId}
          />
        ))}

        {/* Campo de playa deshabilitado para mostrar cual está seleccionada */}
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
          name="nombre"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del tipo de plaza</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ej: Plaza estándar, Plaza premium..."
                  type="text"
                  autoComplete="off"
                  {...field}
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
              <FormLabel>Descripción (opcional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Breve descripción del tipo de plaza..."
                  type="text"
                  autoComplete="off"
                  {...field}
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
            <FormItem className="col-span-2">
              <FormLabel>Caracteristicas</FormLabel>
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
                  placeholder="Selecciona las caracteristicas"
                  multiple
                  fields={{
                    label: 'nombre',
                    value: 'id'
                  }}
                />
              </FormControl>
              <FormMessage />
              <p className="text-muted-foreground mt-1 text-sm">
                Si no seleccionás ninguna característica, la plaza se registrará
                como básica, sin servicios adicionales.
              </p>
            </FormItem>
          )}
        />

        <div className="flex gap-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/tipos-plaza')}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={pending} loading={pending}>
            Crear tipo de plaza
          </Button>
        </div>
      </form>
    </Form>
  )
}
