import { redirect } from 'next/navigation'

import { Link } from 'next-view-transitions'

import { AlertCircle, LogIn } from 'lucide-react'

import LoginForm from '@/app/auth/login/components/LoginForm'
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
  title: 'Iniciar sesión',
  description: 'Iniciar sesión en Valet.',
  pageRoute: '/auth/login'
})

interface LoginPageProps {
  searchParams: SearchParamsType
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  // Si el usuario ya está logueado, redirigir a admin playas
  const user = await getAuthenticatedUser()
  if (user) {
    redirect('/admin')
  }

  const params = await searchParams
  const error = params.error as string
  const message = params.message as string

  return (
    <Card className="border-primary/20 bg-background/95 w-full shadow-xl backdrop-blur-sm">
      <CardHeader className="space-y-1 text-center">
        <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
          <LogIn className="text-primary h-8 w-8" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">
          Iniciar sesión
        </CardTitle>
        <CardDescription>
          Accedé a tu cuenta para gestionar tu playa
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
            Ingresá con tu correo
          </span>
          <div className="grow border-t"></div>
        </div>

        <LoginForm />

        <div className="text-center">
          <Link
            href="/auth/forgot-password"
            className="text-muted-foreground hover:text-primary text-sm transition-colors"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        <Separator className="my-4" />

        <p className="text-muted-foreground text-center text-sm">
          ¿No tenés una cuenta?{' '}
          <Link
            href="/auth/signup"
            className="text-primary hover:text-primary/80 font-medium transition-colors"
          >
            Registrate gratis
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
