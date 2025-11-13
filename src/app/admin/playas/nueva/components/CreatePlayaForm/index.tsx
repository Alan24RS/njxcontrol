'use client'

import { startTransition, useActionState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'

import { useRouter } from 'next/navigation'

import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'

import { createPlayaAction } from '@/app/admin/playas/actions'
import { Button, Form } from '@/components/ui'
import { type CreatePlayaRequest, createPlayaSchema } from '@/schemas/playa'

import Fieldset from './Fieldset'

type FormState = {
  success: boolean
  fields?: Record<string, string>
  errors?: Record<string, string[]>
}

export const DEFAULT_VALUES: CreatePlayaRequest = {
  nombre: '',
  descripcion: '',
  direccion: '',
  ciudad: '',
  provincia: '',
  latitud: 0,
  longitud: 0,
  horario: ''
}

export default function CreatePlayaForm() {
  const [formState, formAction, pending] = useActionState(createPlayaAction, {
    success: false
  } as FormState)
  // Verificación rápida: si formAction no es una función, informar y mostrar toast
  if (typeof formAction !== 'function') {
    console.error(
      'createPlaya: formAction no es una función — useActionState podría estar mal importado o no disponible'
    )
    try {
      toast.error(
        'Error interno: no se puede enviar el formulario (formAction no disponible). Revisa la consola.'
      )
    } catch {
      // ignore if toast not available
    }
  }
  const router = useRouter()

  const formRef = useRef<HTMLFormElement>(null)

  const form = useForm<CreatePlayaRequest>({
    resolver: zodResolver(createPlayaSchema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: DEFAULT_VALUES
  })

  // serializing state removed (not used)

  // dayLabel removed - serialization moved to Fieldset

  // serializeHorarios removed, serialization is handled in Fieldset

  useEffect(() => {
    if (formState.success) {
      toast.success('Playa creada correctamente')
      router.push('/admin/playas')
    } else if (formState.errors) {
      // Mostrar errores de validación con estilo rojo distintivo
      Object.entries(formState.errors).forEach(([field, errors]) => {
        if (field === 'general') {
          toast.error('Error', {
            description: errors.join(', '),
            duration: 6000 // Duración más larga para errores importantes
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
  }, [formState, router])

  const { handleSubmit } = form

  return (
    <Form {...form}>
      <form
        ref={formRef}
        action={formAction}
        onSubmit={handleSubmit(() => {
          // El hidden 'horario' ya debe estar actualizado por Fieldset (watch)
          startTransition(() => {
            formAction(new FormData(formRef.current!))
          })
        })}
        className="space-y-4"
      >
        <Fieldset />
        <div className="mt-8 flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/playas')}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={pending} loading={pending}>
            Crear playa
          </Button>
        </div>
      </form>
    </Form>
  )
}
