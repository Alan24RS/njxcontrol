'use client'

import { useEffect, useState } from 'react'

import { Link } from 'next-view-transitions'

import { RecaudacionTurno } from '@/components/admin/turnos/RecaudacionTurno'
import { buttonVariants } from '@/components/ui'
import { Spinner } from '@/components/ui/spinner'
import { useTurnoActivo } from '@/hooks/queries/turnos/useTurnoActivo'
import { cn } from '@/lib/utils'
import { getPlaya } from '@/services/playas/getPlayaBasica'
import { PlayaBasica } from '@/services/playas/types'

export default function HeaderContainer() {
  const { data: turnoResponse, isLoading: loadingTurno } = useTurnoActivo()
  const [playa, setPlaya] = useState<PlayaBasica | null>(null)

  const turnoActivo = turnoResponse?.data

  useEffect(() => {
    if (turnoActivo?.playaId) {
      getPlaya(turnoActivo.playaId).then((response) => {
        if (response.data) {
          setPlaya(response.data)
        }
      })
    }
  }, [turnoActivo?.playaId])

  const formatFecha = (fecha: Date | null) => {
    if (!fecha) return 'fecha no encontrada'
    return fecha.toLocaleString('es-AR', {
      dateStyle: 'short',
      timeStyle: 'short'
    })
  }

  if (loadingTurno) {
    return (
      <div className="flex w-full justify-between px-6 sm:px-0">
        <h1 className="text-lg font-semibold">Turnos</h1>
        <span className="flex items-center gap-2 text-sm text-gray-500">
          <Spinner className="h-4 w-4" /> Cargando...
        </span>
      </div>
    )
  }

  return (
    <div className="flex w-full items-center justify-between px-6 sm:px-0">
      <h1 className="text-lg font-semibold">Turnos</h1>

      {/* Desktop */}
      <div className="hidden items-center gap-4 sm:flex">
        {turnoActivo ? (
          <>
            <RecaudacionTurno turno={turnoActivo} />
            <div className="flex flex-col items-center rounded-lg bg-blue-100 p-3 text-sm text-blue-900 shadow-md">
              <span className="font-medium">Turno activo desde:</span>
              <span>{formatFecha(new Date(turnoActivo.fechaHoraIngreso))}</span>
              <span className="font-medium">Playa:</span>
              <span>{playa?.nombre}</span>
            </div>
            <Link
              href="/admin/turnos/cerrar-turno"
              className={cn(buttonVariants({ variant: 'default' }))}
              title={'Finalizar turno actual'}
            >
              Finalizar Turno
            </Link>
          </>
        ) : (
          <Link
            href="/admin/turnos/iniciar-turno"
            className={cn(buttonVariants({ variant: 'default' }))}
            title="Iniciar un nuevo turno"
          >
            Iniciar Turno
          </Link>
        )}
      </div>

      {/* Mobile */}
      <div className="fixed right-4 bottom-28 z-20 flex flex-col gap-2 sm:hidden">
        {turnoActivo ? (
          <div className="flex flex-col items-center rounded-lg bg-blue-100 p-3 text-xs text-blue-900 shadow-md">
            <div className="text-center">
              <div className="block font-medium">
                Turno activo en {playa?.nombre}
              </div>
              <div>{formatFecha(new Date(turnoActivo.fechaHoraIngreso))}</div>
            </div>
            <Link
              href="/admin/turnos/cerrar-turno"
              className={cn(buttonVariants({ variant: 'default' }), 'mt-2 h-8')}
              title="Cerrar turno actual"
            >
              Finalizar
            </Link>
          </div>
        ) : (
          <Link
            href="/admin/turnos/iniciar-turno"
            className={cn(buttonVariants({ variant: 'default' }))}
            title="Iniciar un nuevo turno"
          >
            Iniciar turno
          </Link>
        )}
      </div>
    </div>
  )
}
