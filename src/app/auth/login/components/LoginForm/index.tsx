'use client'

import { startTransition, useActionState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'

import { useRouter, useSearchParams } from 'next/navigation'

import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { z } from 'zod'

import { login } from '@/app/auth/actions'
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
import { loginSchema } from '@/schemas/auth'

export default function LoginForm() {
  const [formState, formAction, pending] = useActionState(login, {
    success: false
  })
  const router = useRouter()
  const searchParams = useSearchParams()

  const formRef = useRef<HTMLFormElement>(null)

  // Obtener parámetros de URL
  const emailFromUrl = searchParams.get('email')
  const isNewUser = searchParams.get('newUser') === 'true'

  const form = useForm<z.output<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: emailFromUrl || '',
      password: '',
      ...(formState?.fields ?? {})
    }
  })

  useEffect(() => {
    if (formState.success) {
      toast.success('Has iniciado sesión correctamente')
      router.push('/')
    } else if (formState.errors) {
      const errorMessage = Object.values(formState.errors).flat().join(', ')
      toast.error('Hubo un error al iniciar sesión', {
        description: errorMessage
      })
    }
  }, [formState, router])

  // Mostrar mensaje de bienvenida para nuevos usuarios
  useEffect(() => {
    if (isNewUser && emailFromUrl) {
      toast.info('¡Bienvenido!', {
        description: `Tu cuenta ha sido creada exitosamente. Inicia sesión con tu email: ${emailFromUrl}`,
        duration: 6000
      })
    }
  }, [isNewUser, emailFromUrl])

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
        <FormField
          control={control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contraseña</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="current-password"
                  placeholder="Tu contraseña"
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
          {pending ? 'Iniciando sesión...' : 'Iniciar sesión'}
        </Button>
      </form>
    </Form>
  )
}
