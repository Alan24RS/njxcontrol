'use client'

import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'

import { useRouter } from 'next/navigation'

import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import {
  Button,
  CurrencyInput,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input
} from '@/components/ui'
import { Spinner } from '@/components/ui/spinner'
import { iniciarTurno } from '@/services/turnos'
import { useSelectedPlaya } from '@/stores'

type IniciarTurnoFormData = {
  efectivoInicial: number
}

export default function IniciarTurnoForm() {
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const queryClient = useQueryClient()
  const { selectedPlaya, isLoading } = useSelectedPlaya()
  const formRef = useRef<HTMLFormElement>(null)

  const form = useForm<IniciarTurnoFormData>({
    defaultValues: {
      efectivoInicial: 0
    }
  })

  const { control, handleSubmit } = form

  const onSubmit = async (data: IniciarTurnoFormData) => {
    if (!selectedPlaya) {
      toast.error('Debes seleccionar una playa')
      return
    }

    setLoading(true)
    try {
      const result = await iniciarTurno({
        playaId: selectedPlaya.id,
        efectivoInicial: data.efectivoInicial
      })

      if (result.error) {
        toast.error('No se pudo iniciar el turno', {
          description: result.error
        })
      } else {
        toast.success('¡Turno iniciado correctamente!')
        queryClient.invalidateQueries({ queryKey: ['turno-activo'] })
        router.push('/admin/turnos')
      }
    } catch (err) {
      console.error(err)
      toast.error('Hubo un problema al iniciar el turno.')
    } finally {
      setLoading(false)
    }
  }

  if (isLoading || !selectedPlaya) {
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
        onSubmit={handleSubmit(onSubmit)}
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
          name="efectivoInicial"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Efectivo inicial</FormLabel>
              <FormControl>
                <CurrencyInput
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
            onClick={() => router.push('/admin/turnos')}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={loading} loading={loading}>
            Iniciar turno
          </Button>
        </div>
      </form>
    </Form>
  )
}
