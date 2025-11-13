import { redirect } from 'next/navigation'

import { Link } from 'next-view-transitions'

import { AlertCircle, Lock } from 'lucide-react'

import UpdatePasswordForm from '@/app/auth/update-password/components/UpdatePasswordForm'
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
  title: 'Actualizar contraseña',
  description: 'Crear una nueva contraseña para tu cuenta.',
  pageRoute: '/auth/update-password'
})

interface UpdatePasswordPageProps {
  searchParams: SearchParamsType
}

export default async function UpdatePasswordPage({
  searchParams
}: UpdatePasswordPageProps) {
  // Verificar que haya un usuario autenticado (desde el flujo de recovery)
  const user = await getAuthenticatedUser()

  // Si no hay usuario autenticado, redirigir a forgot-password
  if (!user) {
    redirect('/auth/forgot-password')
  }

  // Obtener parámetros de error
  const params = await searchParams
  const error = params.error as string
  const message = params.message as string

  return (
    <Card className="border-primary/20 bg-background/95 w-full shadow-xl backdrop-blur-sm">
      <CardHeader className="space-y-1 text-center">
        <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
          <Lock className="text-primary h-8 w-8" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">
          Crear nueva contraseña
        </CardTitle>
        <CardDescription>
          Ingresá tu nueva contraseña para acceder a tu cuenta
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
            Debe tener al menos 8 caracteres
          </span>
          <div className="grow border-t"></div>
        </div>

        <UpdatePasswordForm />

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
        </div>
      </CardContent>
    </Card>
  )
}
