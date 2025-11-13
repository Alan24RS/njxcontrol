import { redirect } from 'next/navigation'

import { Link } from 'next-view-transitions'

import { AlertCircle, KeyRound } from 'lucide-react'

import ForgotPasswordForm from '@/app/auth/forgot-password/components/ForgotPasswordForm'
import {
  Alert,
  AlertDescription,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Separator
} from '@/components/ui'
import { getAuthenticatedUser } from '@/lib/supabase/server'
import { generateSyncMetadata } from '@/utils/metadata'

export const metadata = generateSyncMetadata({
  title: 'Recuperar contraseña',
  description: 'Recuperar tu contraseña en Valet.',
  pageRoute: '/auth/forgot-password'
})

interface ForgotPasswordPageProps {
  searchParams: SearchParamsType
}

export default async function ForgotPasswordPage({
  searchParams
}: ForgotPasswordPageProps) {
  const user = await getAuthenticatedUser()
  if (user) {
    redirect('/admin/playas')
  }

  const params = await searchParams
  const error = params.error as string
  const message = params.message as string

  return (
    <Card className="border-primary/20 bg-background/95 w-full shadow-xl backdrop-blur-sm">
      <CardHeader className="space-y-1 text-center">
        <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
          <KeyRound className="text-primary h-8 w-8" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">
          ¿Olvidaste tu contraseña?
        </CardTitle>
        <CardDescription>
          No te preocupes, te enviaremos un enlace para que puedas crear una
          nueva
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {error && message && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        <div className="relative flex items-center py-2">
          <div className="grow border-t"></div>
          <span className="text-muted-foreground mx-4 shrink text-sm">
            Ingresá tu correo electrónico
          </span>
          <div className="grow border-t"></div>
        </div>

        <ForgotPasswordForm />

        <Separator className="my-4" />

        <div className="space-y-2 text-center">
          <p className="text-muted-foreground text-sm">
            ¿Recordaste tu contraseña?{' '}
            <Link
              href="/auth/login"
              className="text-primary hover:text-primary/80 font-medium transition-colors"
            >
              Iniciar sesión
            </Link>
          </p>
          <p className="text-muted-foreground text-sm">
            ¿No tienes una cuenta?{' '}
            <Link
              href="/auth/signup"
              className="text-primary hover:text-primary/80 font-medium transition-colors"
            >
              Registrarse
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
