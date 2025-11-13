'use client'

import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState
} from 'react'
import { useForm } from 'react-hook-form'

import { useRouter } from 'next/navigation'

import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { Loader2, UserCheck, UserPlus } from 'lucide-react'
import { toast } from 'sonner'

import {
  Alert,
  AlertDescription,
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input
} from '@/components/ui'
import ComboboxWithSearch from '@/components/ui/ComboboxSearch'
import useDebounce from '@/hooks/useDebounce'
import {
  type InvitarPlayeroRequest,
  invitarPlayeroSchema
} from '@/schemas/playero'
import { getPlayasBasicasClient } from '@/services/playas/getPlayasBasicasClient'
import { checkEmailExists } from '@/services/playeros'

import { invitarPlayeroAction } from '../../../actions'

type FormState = {
  success: boolean
  fields?: Record<string, string>
  errors?: Record<string, string[]>
}

export default function InvitarPlayeroForm() {
  const [formState, formAction, pending] = useActionState(
    invitarPlayeroAction,
    {
      success: false
    } as FormState
  )
  const router = useRouter()

  const formRef = useRef<HTMLFormElement>(null)

  // Obtener playas del usuario
  const { data: playasResponse } = useQuery({
    queryKey: ['playas-basicas'],
    queryFn: () => getPlayasBasicasClient({})
  })

  const playas = playasResponse?.data || []

  // Transformar playas para el ComboboxWithSearch
  const playasOptions = playas.map((playa) => ({
    id: playa.id,
    nombre: playa.nombre || playa.direccion,
    direccion: playa.direccion
  }))

  const [emailCheckStatus, setEmailCheckStatus] = useState<{
    checking: boolean
    exists: boolean | null
    userName: string | null
  }>({
    checking: false,
    exists: null,
    userName: null
  })

  const form = useForm<InvitarPlayeroRequest>({
    resolver: zodResolver(invitarPlayeroSchema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: {
      nombre: '',
      email: '',
      playasIds: [],
      usuarioExiste: false
    }
  })

  const emailValue = form.watch('email')
  const debouncedEmail = useDebounce(emailValue, 500)

  useEffect(() => {
    const checkEmail = async () => {
      if (!debouncedEmail || debouncedEmail.length < 3) {
        setEmailCheckStatus({ checking: false, exists: null, userName: null })
        form.setValue('usuarioExiste', false)
        return
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(debouncedEmail)) {
        setEmailCheckStatus({ checking: false, exists: null, userName: null })
        return
      }

      setEmailCheckStatus({ checking: true, exists: null, userName: null })

      try {
        const result = await checkEmailExists(debouncedEmail)
        if (result.data) {
          setEmailCheckStatus({
            checking: false,
            exists: result.data.existe,
            userName: result.data.nombre
          })
          form.setValue('usuarioExiste', result.data.existe)

          if (result.data.existe) {
            form.setValue('nombre', '')
          }
        }
      } catch (error) {
        console.error('Error checking email:', error)
        setEmailCheckStatus({ checking: false, exists: null, userName: null })
      }
    }

    checkEmail()
  }, [debouncedEmail, form])

  useEffect(() => {
    if (formState.success) {
      toast.success('Invitación enviada correctamente')
      router.push('/admin/playeros')
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
  }, [formState, router])

  const { handleSubmit, control, watch } = form
  const playasIdsValue = watch('playasIds')

  return (
    <Form {...form}>
      <form
        ref={formRef}
        action={formAction}
        onSubmit={(evt) => {
          evt.preventDefault()
          handleSubmit(() => {
            startTransition(() => {
              const formData = new FormData(formRef.current!)
              // Agregar playasIds como string separado por comas
              formData.set('playasIds', playasIdsValue.join(','))
              formAction(formData)
            })
          })(evt)
        }}
        className="space-y-6"
      >
        <FormField
          control={control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Correo electrónico *</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    placeholder="ejemplo@correo.com"
                    autoComplete="email"
                    type="email"
                    disabled={pending}
                    {...field}
                  />
                  {emailCheckStatus.checking && (
                    <div className="absolute top-1/2 right-3 -translate-y-1/2">
                      <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
                    </div>
                  )}
                </div>
              </FormControl>
              <FormMessage />
              {emailCheckStatus.exists === true &&
                emailCheckStatus.userName && (
                  <Alert className="border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200">
                    <UserCheck className="h-4 w-4" />
                    <AlertDescription>
                      Usuario existente:
                      <span className="text-primary font-bold">
                        {emailCheckStatus.userName}
                      </span>
                      Se enviará una invitación a sus playas.
                    </AlertDescription>
                  </Alert>
                )}
              {emailCheckStatus.exists === false && (
                <Alert className="border-green-200 bg-green-50 text-green-900 dark:border-green-900 dark:bg-green-950 dark:text-green-200">
                  <UserPlus className="h-4 w-4" />
                  <AlertDescription>
                    Usuario nuevo. Se creará una cuenta con este email.
                  </AlertDescription>
                </Alert>
              )}
            </FormItem>
          )}
        />

        {emailCheckStatus.exists === false && (
          <FormField
            control={control}
            name="nombre"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre provisional *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Juan Pérez"
                    autoComplete="name"
                    disabled={pending}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={control}
          name="playasIds"
          render={({ field }) => {
            const selectedPlayas = field.value
              .map((id) => {
                const playa = playasOptions.find((p) => p.id === id)
                return playa ? { id: playa.id, nombre: playa.nombre } : null
              })
              .filter(Boolean)

            return (
              <FormItem>
                <FormLabel>Playas a asignar</FormLabel>
                <FormControl>
                  <ComboboxWithSearch
                    name="playasIds"
                    placeholder="Buscar y seleccionar playas..."
                    multiple={true}
                    value={selectedPlayas}
                    queryFn={({ query }) => getPlayasBasicasClient({ query })}
                    fields={{ label: 'nombre', value: 'id' }}
                    initialData={playasOptions}
                    onChange={(selectedOptions: any) => {
                      const ids = Array.isArray(selectedOptions)
                        ? selectedOptions.map((option) => option.id)
                        : []
                      field.onChange(ids)
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )
          }}
        />

        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/playeros')}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={pending} loading={pending}>
            Enviar invitación
          </Button>
        </div>
      </form>
    </Form>
  )
}
