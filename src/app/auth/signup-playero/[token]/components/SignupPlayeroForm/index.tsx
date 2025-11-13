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
import { CheckCircle2, UserCheck, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { z } from 'zod'

import {
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Separator
} from '@/components/ui'
import { acceptInvitationSchema, signupPlayeroSchema } from '@/schemas/auth'
import { rejectInvitation } from '@/services/playeros'

import { acceptInvitationExistingUser, signupPlayero } from '../../../actions'

interface InvitacionData {
  email: string
  nombre: string
  dueno_nombre: string
  playas_nombres: string[]
  usuario_existe?: boolean
}

interface Props {
  token: string
  invitacionData: InvitacionData
}

type FormState = {
  success: boolean
  message?: string
  fields?: Record<string, string>
  errors?: Record<string, string[]>
}

type AcceptInvitationFormData = z.infer<typeof acceptInvitationSchema>
type SignupPlayeroFormData = z.infer<typeof signupPlayeroSchema>
type FormData = AcceptInvitationFormData | SignupPlayeroFormData

export default function SignupPlayeroForm({ token, invitacionData }: Props) {
  const isExistingUser = invitacionData.usuario_existe === true
  const [isRejecting, setIsRejecting] = useState(false)

  const [formState, formAction, pending] = useActionState(
    isExistingUser ? acceptInvitationExistingUser : signupPlayero,
    {
      success: false
    } as FormState
  )

  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)

  const handleReject = async () => {
    if (!confirm('¿Estás seguro que deseas rechazar esta invitación?')) {
      return
    }

    setIsRejecting(true)
    try {
      const result = await rejectInvitation(token)
      if (result.data) {
        toast.success('Invitación rechazada', {
          description: 'Has rechazado la invitación correctamente',
          duration: 5000
        })
        setTimeout(() => {
          router.push('/auth/login')
        }, 1500)
      } else {
        toast.error('Error', {
          description: result.error || 'No se pudo rechazar la invitación'
        })
      }
    } catch {
      toast.error('Error', {
        description: 'Ocurrió un error al rechazar la invitación'
      })
    } finally {
      setIsRejecting(false)
    }
  }

  const form = useForm<FormData>({
    resolver: zodResolver(
      isExistingUser ? acceptInvitationSchema : signupPlayeroSchema
    ) as any,
    defaultValues: isExistingUser
      ? ({ token } as AcceptInvitationFormData)
      : ({
          token,
          name: invitacionData.nombre || '',
          password: '',
          confirmPassword: '',
          ...(formState?.fields ?? {})
        } as SignupPlayeroFormData)
  })

  useEffect(() => {
    if (formState.success) {
      const message = formState.message || '¡Operación exitosa!'

      if (isExistingUser) {
        toast.success(message, {
          description: 'Inicia sesión para acceder a las playas asignadas',
          duration: 5000
        })

        const loginUrl = new URL('/auth/login', window.location.origin)
        loginUrl.searchParams.set('email', invitacionData.email)
        loginUrl.searchParams.set('invitationAccepted', 'true')

        setTimeout(() => {
          router.push(loginUrl.toString())
        }, 1500)
      } else {
        toast.success(message, {
          description: 'Ahora puedes iniciar sesión con tus credenciales',
          duration: 5000
        })

        const loginUrl = new URL('/auth/login', window.location.origin)
        loginUrl.searchParams.set('email', invitacionData.email)
        loginUrl.searchParams.set('newUser', 'true')

        setTimeout(() => {
          router.push(loginUrl.toString())
        }, 1500)
      }
    } else if (formState.errors) {
      const errorMessage = Object.values(formState.errors).flat().join(', ')
      toast.error('Error', {
        description: errorMessage
      })
    }
  }, [formState, router, invitacionData.email, isExistingUser])

  const { control, handleSubmit } = form

  return (
    <Card className="border-primary/20 bg-background/95 w-full shadow-xl backdrop-blur-sm">
      <CardHeader className="space-y-1 text-center">
        <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
          <UserCheck className="text-primary h-8 w-8" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">
          {isExistingUser ? 'Aceptar Invitación' : 'Completar Registro'}
        </CardTitle>
        <CardDescription>
          {invitacionData.dueno_nombre} te ha invitado a ser playero
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="bg-muted/50 space-y-2 rounded-lg p-4">
          <div className="text-sm">
            <span className="font-medium">Email:</span> {invitacionData.email}
          </div>
          <div className="text-sm">
            <span className="font-medium">Invitado por:</span>{' '}
            {invitacionData.dueno_nombre}
          </div>
          <div className="text-sm">
            <span className="font-medium">Playas asignadas:</span>
            <ul className="mt-1 ml-4 list-disc">
              {invitacionData.playas_nombres.map((playa, index) => (
                <li key={index} className="text-muted-foreground">
                  {playa}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator />

        <Form {...form}>
          <form
            ref={formRef}
            action={formAction}
            onSubmit={(evt) => {
              evt.preventDefault()
              handleSubmit(() => {
                startTransition(() =>
                  formAction(new FormData(formRef.current!))
                )
              })(evt)
            }}
            className="space-y-4"
          >
            <input type="hidden" name="token" value={token} />

            {isExistingUser ? (
              <>
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    Ya tienes una cuenta en el sistema. Al aceptar esta
                    invitación, las playas se agregarán a tu cuenta existente.
                  </AlertDescription>
                </Alert>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    disabled={pending || isRejecting}
                    onClick={handleReject}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Rechazar
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={pending || isRejecting}
                    loading={pending}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Aceptar
                  </Button>
                </div>
              </>
            ) : (
              <>
                <FormField
                  control={control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre completo</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Tu nombre completo"
                          autoComplete="name"
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
                          placeholder="Mínimo 8 caracteres"
                          autoComplete="new-password"
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
                          placeholder="Repetir contraseña"
                          autoComplete="new-password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    disabled={pending || isRejecting}
                    onClick={handleReject}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Rechazar
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={pending || isRejecting}
                    loading={pending}
                  >
                    Crear cuenta
                  </Button>
                </div>
              </>
            )}
          </form>
        </Form>

        <div className="text-muted-foreground text-center text-sm">
          {isExistingUser
            ? 'Al aceptar, confirmas que deseas trabajar en estas playas'
            : 'Al crear tu cuenta, aceptas los términos y condiciones del servicio'}
        </div>
      </CardContent>
    </Card>
  )
}
