'use client'

import { startTransition, useActionState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'

import { useRouter } from 'next/navigation'

import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { z } from 'zod'

import { updatePassword } from '@/app/auth/actions'
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
import { updatePasswordSchema } from '@/schemas/auth'

export default function UpdatePasswordForm() {
  const [formState, formAction, pending] = useActionState(updatePassword, {
    success: false
  })
  const router = useRouter()

  const formRef = useRef<HTMLFormElement>(null)

  const form = useForm<z.output<typeof updatePasswordSchema>>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
      ...(formState?.fields ?? {})
    }
  })

  useEffect(() => {
    if (formState.success) {
      toast.success('Contraseña actualizada correctamente', {
        description: 'Tu contraseña ha sido cambiada exitosamente'
      })
      router.push('/auth/login')
    } else if (formState.errors) {
      const errorMessage = Object.values(formState.errors).flat().join(', ')
      toast.error('Error al actualizar la contraseña', {
        description: errorMessage
      })
    }
  }, [formState, router])

  const { control, handleSubmit } = form

  return (
    <Form {...form}>
      <form
        ref={formRef}
        action={formAction}
        onSubmit={(evt) => {
          evt.preventDefault()
          handleSubmit(() => {
            startTransition(() => formAction(new FormData(formRef.current!)))
          })(evt)
        }}
        className="space-y-6"
      >
        <FormField
          control={control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nueva contraseña</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="new-password"
                  placeholder="Tu nueva contraseña"
                  className="h-12"
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
                  type="password"
                  autoComplete="new-password"
                  placeholder="Confirma tu nueva contraseña"
                  className="h-12"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className="bg-primary hover:bg-primary/90 text-primary-foreground w-full shadow-lg"
          size="lg"
          disabled={pending}
        >
          {pending ? 'Actualizando...' : 'Actualizar contraseña'}
        </Button>
      </form>
    </Form>
  )
}
