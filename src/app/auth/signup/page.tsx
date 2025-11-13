import { redirect } from 'next/navigation'

import { Link } from 'next-view-transitions'

import { UserPlus } from 'lucide-react'

import SignupForm from '@/app/auth/signup/components/SignupForm'
import {
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
  title: 'Registrarse',
  description: 'Registrarse en Valet',
  pageRoute: '/auth/signup'
})

export default async function SignupPage() {
  // Si el usuario ya está logueado, redirigir a admin playas
  const user = await getAuthenticatedUser()
  if (user) {
    redirect('/admin')
  }

  return (
    <Card className="border-primary/20 bg-background/95 w-full shadow-xl backdrop-blur-sm">
      <CardHeader className="space-y-1 text-center">
        <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
          <UserPlus className="text-primary h-8 w-8" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">
          Crear cuenta
        </CardTitle>
        <CardDescription>Comenzá a digitalizar tu playa</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="relative flex items-center py-2">
          <div className="grow border-t"></div>
          <span className="text-muted-foreground mx-4 shrink text-sm">
            Completá con tu información
          </span>
          <div className="grow border-t"></div>
        </div>

        <SignupForm />

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
          ¿Ya tenés una cuenta?{' '}
          <Link
            href="/auth/login"
            className="text-primary hover:text-primary/80 font-medium transition-colors"
          >
            Iniciá sesión
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
