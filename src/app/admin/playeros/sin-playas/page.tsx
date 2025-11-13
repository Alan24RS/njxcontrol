import { Building2, Mail } from 'lucide-react'

import {
  Alert,
  AlertDescription,
  AlertTitle,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui'
import { createClient } from '@/lib/supabase/server'
import { generateSyncMetadata } from '@/utils/metadata'

export const metadata = generateSyncMetadata({
  title: 'Sin Playas Asignadas',
  description: 'No tienes playas asignadas',
  pageRoute: '/admin/playeros/sin-playas'
})

export default async function SinPlayasPage() {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  return (
    <div className="container mx-auto flex min-h-[60vh] items-center justify-center p-6">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="bg-muted mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full">
            <Building2 className="text-muted-foreground h-10 w-10" />
          </div>
          <CardTitle className="text-3xl">Sin Playas Asignadas</CardTitle>
          <CardDescription className="text-base">
            Actualmente no tienes acceso a ninguna playa
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <Alert>
            <Mail className="h-4 w-4" />
            <AlertTitle>¿Cómo obtener acceso?</AlertTitle>
            <AlertDescription>
              Para acceder a una playa, debes contactar al dueño de la playa y
              solicitarle que te invite al sistema. Una vez que te invite,
              recibirás un correo electrónico con instrucciones para aceptar la
              invitación.
            </AlertDescription>
          </Alert>

          <div className="bg-muted rounded-lg p-4">
            <h3 className="mb-2 font-semibold">Tu información de contacto:</h3>
            <div className="text-muted-foreground space-y-1 text-sm">
              <p>
                <span className="font-medium">Email:</span> {user?.email}
              </p>
              <p>
                <span className="font-medium">Nombre:</span>{' '}
                {(user as any)?.user_metadata?.name || 'Sin nombre registrado'}
              </p>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="mb-3 font-semibold">Pasos para obtener acceso:</h3>
            <ol className="space-y-2 text-sm">
              <li className="flex gap-2">
                <span className="bg-primary text-primary-foreground flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                  1
                </span>
                <span>Contacta al dueño de la playa donde deseas trabajar</span>
              </li>
              <li className="flex gap-2">
                <span className="bg-primary text-primary-foreground flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                  2
                </span>
                <span>
                  Proporciona tu email registrado:{' '}
                  <strong>{user?.email}</strong>
                </span>
              </li>
              <li className="flex gap-2">
                <span className="bg-primary text-primary-foreground flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                  3
                </span>
                <span>Espera a recibir el correo de invitación y acéptala</span>
              </li>
              <li className="flex gap-2">
                <span className="bg-primary text-primary-foreground flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                  4
                </span>
                <span>
                  Una vez aceptada, podrás acceder a la playa asignada
                </span>
              </li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
