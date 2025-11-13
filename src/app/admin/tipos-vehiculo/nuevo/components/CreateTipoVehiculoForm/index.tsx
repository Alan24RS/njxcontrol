'use client'

import { startTransition, useActionState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'

import { useRouter } from 'next/navigation'

import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { createTipoVehiculoAction } from '@/app/admin/tipos-vehiculo/actions'
import {
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
import { TIPO_VEHICULO, TIPO_VEHICULO_LABEL } from '@/constants/tipoVehiculo'
import {
  CreateTipoVehiculoPlayaRequest,
  createTipoVehiculoPlayaSchema
} from '@/schemas/tipo-vehiculo-playa'
import { useSelectedPlaya } from '@/stores'

type FormState = {
  success: boolean
  fields?: Record<string, string>
  errors?: Record<string, string[]>
}

export default function CreateTipoVehiculoForm() {
  const [formState, formAction, pending] = useActionState(
    createTipoVehiculoAction,
    {
      success: false
    } as FormState
  )
  const router = useRouter()
  const queryClient = useQueryClient()

  const { selectedPlaya, isLoading } = useSelectedPlaya()

  const formRef = useRef<HTMLFormElement>(null)

  const form = useForm<CreateTipoVehiculoPlayaRequest>({
    resolver: zodResolver(createTipoVehiculoPlayaSchema),
    defaultValues: {
      playaId: selectedPlaya?.id,
      tipoVehiculo: undefined,
      ...(formState?.fields ?? {})
    }
  })

  useEffect(() => {
    if (formState.success) {
      queryClient.invalidateQueries({
        queryKey: ['tipos-vehiculo']
      })
      toast.success('Tipo de vehículo agregado correctamente')
      router.push('/admin/tipos-vehiculo')
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

  const { control, handleSubmit, setValue, watch } = form

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

  const tipoVehiculoSelected = watch('tipoVehiculo')

  return (
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
        <input type="hidden" name="playaId" value={selectedPlaya.id} />

        <input
          type="hidden"
          name="tipoVehiculo"
          value={tipoVehiculoSelected || ''}
        />

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
          name="tipoVehiculo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Vehículo</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger name={field.name}>
                    <SelectValue placeholder="Selecciona un tipo de vehículo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.values(TIPO_VEHICULO).map((option) => (
                    <SelectItem key={option} value={option}>
                      {TIPO_VEHICULO_LABEL[option]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/tipos-vehiculo')}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={pending} loading={pending}>
            Agregar tipo de vehículo
          </Button>
        </div>
      </form>
    </Form>
  )
}
