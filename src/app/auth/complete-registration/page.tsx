import { Suspense } from 'react'

import { redirect } from 'next/navigation'

import { Link } from 'next-view-transitions'

import { UserCheck } from 'lucide-react'

import CompleteRegistrationForm from '@/app/auth/complete-registration/components/CompleteRegistrationForm'
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
  title: 'Completar Registro',
  description: 'Completa tu registro como playero',
  pageRoute: '/auth/complete-registration'
})

export default async function CompleteRegistrationPage() {
  // Si el usuario ya está logueado y completamente configurado, redirigir a admin
  const user = await getAuthenticatedUser()
  if (user && user.name) {
    redirect('/admin')
  }

  return (
    <Card className="border-primary/20 bg-background/95 w-full shadow-xl backdrop-blur-sm">
      <CardHeader className="space-y-1 text-center">
        <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
          <UserCheck className="text-primary h-8 w-8" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">
          Completar Registro
        </CardTitle>
        <CardDescription>
          Establece tu contraseña y completa tu perfil
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="relative flex items-center py-2">
          <div className="grow border-t"></div>
          <span className="text-muted-foreground mx-4 shrink text-sm">
            Últimos pasos para acceder
          </span>
          <div className="grow border-t"></div>
        </div>

        <Suspense fallback={<div className="text-center">Cargando...</div>}>
          <CompleteRegistrationForm />
        </Suspense>

        <Separator className="my-4" />

        <p className="text-muted-foreground text-center text-sm">
          ¿Problemas con el registro?{' '}
          <Link
            href="/auth/login"
            className="text-primary hover:text-primary/80 font-medium transition-colors"
          >
            Volver al login
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
