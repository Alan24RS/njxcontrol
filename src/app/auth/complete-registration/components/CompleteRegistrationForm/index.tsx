'use client'

import { startTransition, useActionState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'

import { useRouter, useSearchParams } from 'next/navigation'

import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { z } from 'zod'

import { completeRegistration } from '@/app/auth/complete-registration/actions'
import InvitationDetails from '@/app/auth/complete-registration/components/InvitationDetails'
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

const completeRegistrationSchema = z
  .object({
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    password: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres'),
    confirmPassword: z.string()
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword']
  })

type FormState = {
  success: boolean
  fields?: Record<string, string>
  errors?: Record<string, string[]>
}

export default function CompleteRegistrationForm() {
  const [formState, formAction, pending] = useActionState(
    completeRegistration,
    {
      success: false
    } as FormState
  )
  const router = useRouter()
  const searchParams = useSearchParams()

  const formRef = useRef<HTMLFormElement>(null)

  // Obtener parámetros de invitación de la URL o localStorage
  const invitedBy = searchParams.get('invited_by')
  const userEmail = searchParams.get('email')

  const form = useForm<z.output<typeof completeRegistrationSchema>>({
    resolver: zodResolver(completeRegistrationSchema),
    defaultValues: {
      name: '',
      password: '',
      confirmPassword: '',
      ...(formState?.fields ?? {})
    }
  })

  useEffect(() => {
    if (formState.success) {
      toast.success('Registro completado correctamente', {
        description: 'Bienvenido a Valet'
      })
      router.push('/admin')
    } else if (formState.errors) {
      const errorMessage = Object.values(formState.errors).flat().join(', ')
      toast.error('Error al completar el registro', {
        description: errorMessage
      })
    }
  }, [formState, router])

  const { control, handleSubmit } = form

  return (
    <div className="space-y-6">
      {/* Mostrar detalles de invitación si están disponibles */}
      {invitedBy && userEmail && (
        <InvitationDetails email={userEmail} duenoId={invitedBy} />
      )}

      <Form {...form}>
        <form
          ref={formRef}
          action={formAction}
          onSubmit={(evt) => {
            evt.preventDefault()
            handleSubmit(() => {
              startTransition(() => {
                const formData = new FormData(formRef.current!)
                formAction(formData)
              })
            })(evt)
          }}
          className="space-y-6"
        >
          <FormField
            control={control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre completo</FormLabel>
                <FormControl>
                  <Input placeholder="Tu nombre completo" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contraseña</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Mínimo 8 caracteres"
                    type="password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirmar contraseña</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Repite tu contraseña"
                    type="password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full"
            disabled={pending}
            loading={pending}
          >
            Completar registro
          </Button>
        </form>
      </Form>
    </div>
  )
}
