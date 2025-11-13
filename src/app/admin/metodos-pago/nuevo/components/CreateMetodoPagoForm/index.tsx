'use client'

import { startTransition, useActionState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'

import { useRouter } from 'next/navigation'

import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { createMetodoPagoAction } from '@/app/admin/metodos-pago/actions'
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
import { METODO_PAGO, METODO_PAGO_LABEL } from '@/constants/metodoPago'
import {
  CreateMetodoPagoPlayaRequest,
  createMetodoPagoPlayaSchema
} from '@/schemas/metodo-pago-playa'
import { useSelectedPlaya } from '@/stores'

type FormState = {
  success: boolean
  fields?: Record<string, string>
  errors?: Record<string, string[]>
}

export default function CreateMetodoPagoForm() {
  const [formState, formAction, pending] = useActionState(
    createMetodoPagoAction,
    {
      success: false
    } as FormState
  )
  const router = useRouter()
  const queryClient = useQueryClient()

  const { selectedPlaya, isLoading } = useSelectedPlaya()

  const formRef = useRef<HTMLFormElement>(null)

  const form = useForm<CreateMetodoPagoPlayaRequest>({
    resolver: zodResolver(createMetodoPagoPlayaSchema),
    defaultValues: {
      playaId: selectedPlaya?.id,
      metodoPago: undefined,
      ...(formState?.fields ?? {})
    }
  })

  useEffect(() => {
    if (formState.success) {
      queryClient.invalidateQueries({
        queryKey: ['metodos-pago-playa']
      })
      toast.success('Método de pago agregado correctamente')
      router.push('/admin/metodos-pago')
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

  const metodoPagoSelected = watch('metodoPago')

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
          name="metodoPago"
          value={metodoPagoSelected || ''}
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
          name="metodoPago"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Método de Pago</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger name={field.name}>
                    <SelectValue placeholder="Selecciona un método de pago" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.values(METODO_PAGO).map((option) => (
                    <SelectItem key={option} value={option}>
                      {METODO_PAGO_LABEL[option]}
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
            onClick={() => router.push('/admin/metodos-pago')}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={pending} loading={pending}>
            Agregar método de pago
          </Button>
        </div>
      </form>
    </Form>
  )
}
