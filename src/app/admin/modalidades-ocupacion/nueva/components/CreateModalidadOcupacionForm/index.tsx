'use client'

import { startTransition, useActionState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'

import { useRouter } from 'next/navigation'

import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { createModalidadOcupacionAction } from '@/app/admin/modalidades-ocupacion/actions'
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
import {
  MODALIDAD_OCUPACION,
  MODALIDAD_OCUPACION_LABEL
} from '@/constants/modalidadOcupacion'
import {
  CreateModalidadOcupacionRequest,
  createModalidadOcupacionSchema
} from '@/schemas/modalidad-ocupacion'
import { useSelectedPlaya } from '@/stores'

type FormState = {
  success: boolean
  fields?: Record<string, string>
  errors?: Record<string, string[]>
}

export default function CreateModalidadOcupacionForm() {
  const [formState, formAction, pending] = useActionState(
    createModalidadOcupacionAction,
    {
      success: false
    } as FormState
  )
  const router = useRouter()
  const queryClient = useQueryClient()

  const { selectedPlaya, isLoading } = useSelectedPlaya()

  const formRef = useRef<HTMLFormElement>(null)

  const form = useForm<CreateModalidadOcupacionRequest>({
    resolver: zodResolver(createModalidadOcupacionSchema),
    defaultValues: {
      playaId: (selectedPlaya as any)?.playa_id || selectedPlaya?.id || '',
      modalidadOcupacion: '' as any,
      ...(formState?.fields ?? {})
    }
  })

  useEffect(() => {
    if (formState.success) {
      queryClient.invalidateQueries({
        queryKey: ['modalidades-ocupacion']
      })
      toast.success('Modalidad de ocupación creada correctamente')
      router.push('/admin/modalidades-ocupacion')
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
    if (selectedPlaya) {
      const playaId = (selectedPlaya as any).playa_id || selectedPlaya.id

      if (playaId) {
        setValue('playaId', playaId)
      }
    }
  }, [selectedPlaya, setValue])

  if (!selectedPlaya || isLoading) {
    return (
      <div className="flex w-full grow flex-col items-center justify-center space-y-4 p-8">
        <Spinner />
      </div>
    )
  }

  return (
    <Form {...form}>
      <form
        ref={formRef}
        onSubmit={(evt) => {
          evt.preventDefault()
          handleSubmit(
            (data) => {
              startTransition(() => {
                const formData = new FormData()
                formData.append('playaId', data.playaId)
                formData.append('modalidadOcupacion', data.modalidadOcupacion)
                formAction(formData)
              })
            },
            (errors) => {
              console.error('Form validation failed:', errors)
              toast.error('Hay errores en el formulario', {
                description: 'Por favor revisa los campos marcados'
              })
            }
          )(evt)
        }}
        className="space-y-6"
      >
        <FormField
          control={control}
          name="playaId"
          render={({ field }) => <input type="hidden" {...field} />}
        />

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
          name="modalidadOcupacion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Modalidad de Ocupación</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una modalidad de ocupación" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.values(MODALIDAD_OCUPACION).map((option) => (
                    <SelectItem key={option} value={option}>
                      {MODALIDAD_OCUPACION_LABEL[option]}
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
            onClick={() => router.push('/admin/modalidades-ocupacion')}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={pending} loading={pending}>
            Agregar modalidad
          </Button>
        </div>
      </form>
    </Form>
  )
}
