'use client'

import { CheckCircle } from 'lucide-react'

import { Button } from '@/components/ui'
import { signOut } from '@/lib/supabase/browser'

export default function InitialMessage({
  setIsStarted,
  mode = 'welcome',
  onCancel
}: {
  setIsStarted: (isStarted: boolean) => void
  mode?: 'welcome' | 'create'
  onCancel?: () => void
}) {
  const isWelcome = mode === 'welcome'
  return (
    <div className="mt-6 flex grow flex-col space-y-8">
      <div className="space-y-1 text-center">
        {isWelcome ? (
          <>
            <p className="text-muted-foreground">
              ¡Bienvenido a Valet! 🎉 Comencemos registrando tu primera playa.
            </p>
            <p className="text-muted-foreground">
              No te preocupes, se creará en modo borrador y podrás editarla
              cuando quieras.
            </p>
          </>
        ) : (
          <>
            <p className="text-muted-foreground">
              Crea una nueva playa con todos sus datos de configuración en una
              sola transacción.
            </p>
            <p className="text-muted-foreground">
              Esto incluye tipos de plaza, tarifas, plazas individuales y
              métodos de pago.
            </p>
          </>
        )}
      </div>

      <div className="space-y-6">
        <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-950/50">
          <h3 className="font-medium text-blue-900 dark:text-blue-100">
            ¿Qué vas a lograr?
          </h3>
          <ul className="mt-2 space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <li className="flex items-center">
              <CheckCircle className="mr-2 h-4 w-4" />
              Gestionar tu playa digitalmente
            </li>
            <li className="flex items-center">
              <CheckCircle className="mr-2 h-4 w-4" />
              Optimizar tus ingresos automáticamente
            </li>
            <li className="flex items-center">
              <CheckCircle className="mr-2 h-4 w-4" />
              Atraer más conductores a tu playa
            </li>
          </ul>
        </div>

        <p className="text-muted-foreground text-center">
          {isWelcome
            ? 'El proceso es rápido y sencillo. ¡Comencemos registrando tu primera playa!'
            : 'El proceso es rápido y sencillo. ¡Comencemos creando tu nueva playa!'}
        </p>
      </div>

      <div className="flex grow items-end justify-between gap-2">
        {isWelcome ? (
          <Button variant="outline" onClick={() => signOut()}>
            Cerrar sesión
          </Button>
        ) : (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <Button onClick={() => setIsStarted(true)}>Comenzar</Button>
        </div>
      </div>
    </div>
  )
}
