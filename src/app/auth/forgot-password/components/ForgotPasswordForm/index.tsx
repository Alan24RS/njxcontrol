'use client'

import { startTransition, useActionState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'

import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { z } from 'zod'

import { forgotPassword } from '@/app/auth/actions'
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
import { forgotPasswordSchema } from '@/schemas/auth'

export default function ForgotPasswordForm() {
  const [formState, formAction, pending] = useActionState(forgotPassword, {
    success: false
  })

  const formRef = useRef<HTMLFormElement>(null)

  const form = useForm<z.output<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
      ...(formState?.fields ?? {})
    }
  })

  useEffect(() => {
    if (formState.success) {
      toast.success('Correo enviado correctamente', {
        description:
          'Revisá tu bandeja de entrada y seguí las instrucciones para recuperar tu contraseña.'
      })
      form.reset()
    } else if (formState.errors) {
      const errorMessage = Object.values(formState.errors).flat().join(', ')
      toast.error('Error al enviar el correo', {
        description: errorMessage
      })
    }
  }, [formState, form])

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
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder="tu@email.com"
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
          {pending ? 'Enviando...' : 'Enviar enlace de recuperación'}
        </Button>
      </form>
    </Form>
  )
}
