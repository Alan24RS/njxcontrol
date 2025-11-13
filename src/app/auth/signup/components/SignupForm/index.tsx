'use client'

import { startTransition, useActionState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'

import { useRouter } from 'next/navigation'

import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { z } from 'zod'

import { signup } from '@/app/auth/actions'
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
import { signupSchema } from '@/schemas/auth'

export default function SignupForm() {
  const [formState, formAction, pending] = useActionState(signup, {
    success: false
  })
  const router = useRouter()

  const formRef = useRef<HTMLFormElement>(null)

  const form = useForm<z.output<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      ...(formState?.fields ?? {})
    }
  })

  useEffect(() => {
    if (formState.success) {
      toast.success('Has creado tu cuenta correctamente', {
        description: 'Revisa tu casilla de correo para verificar tu cuenta'
      })
      router.push('/auth/login')
    } else if (formState.errors) {
      const errorMessage = Object.values(formState.errors).flat().join(', ')
      toast.error('Hubo un error al crear tu cuenta', {
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
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre y apellido</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  autoComplete="name"
                  placeholder="Tu nombre y apellido"
                  className="h-12"
                  {...field}
                  onKeyDown={(e) => {
                    // Solo bloquea números para permitir escritura natural de tildes
                    if (/[0-9]/.test(e.key) && !e.ctrlKey && !e.metaKey) {
                      e.preventDefault()
                    }
                  }}
                  onInput={(e) => {
                    const input = e.target as HTMLInputElement
                    // Solo remueve números, el schema validará el resto
                    const newValue = input.value.replace(/[0-9]/g, '')
                    if (newValue !== input.value) {
                      input.value = newValue
                      field.onChange(newValue)
                    }
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
                  autoComplete="new-password"
                  placeholder="Mínimo 8 caracteres"
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
                  placeholder="Repetí tu contraseña"
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
          {pending ? 'Creando cuenta...' : 'Crear cuenta gratis'}
        </Button>
      </form>
    </Form>
  )
}
