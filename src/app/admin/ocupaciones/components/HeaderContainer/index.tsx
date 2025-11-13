'use client'

import { Link } from 'next-view-transitions'

import { PlusIcon } from 'lucide-react'
import { toast } from 'sonner'

import { Button, buttonVariants } from '@/components/ui'
import { ROL } from '@/constants/rol'
import { useTurnoActivo } from '@/hooks/queries/turnos/useTurnoActivo'
import { cn } from '@/lib/utils'
import { useSelectedPlaya } from '@/stores/useSelectedPlaya'
import { User } from '@/types/auth'

interface HeaderContainerProps {
  user: User | null
}

export default function HeaderContainer({ user }: HeaderContainerProps) {
  const { selectedPlaya } = useSelectedPlaya()

  const isDueno = user?.roles?.includes(ROL.DUENO) ?? false

  const { data: turnoResponse, isLoading: turnoLoading } = useTurnoActivo({
    enabled: !isDueno
  })

  // Dueños siempre pueden registrar ocupaciones
  // Playeros necesitan turno activo en la playa seleccionada
  const hasTurnoActivo =
    isDueno ||
    (!!turnoResponse?.data && turnoResponse.data.playaId === selectedPlaya?.id)

  const handleClickWithoutTurno = (e: React.MouseEvent) => {
    e.preventDefault()
    toast.warning('Sin turno activo', {
      description:
        'Debes iniciar un turno antes de registrar ocupaciones. Ve a la sección de Turnos para iniciar uno.'
    })
  }

  return (
    <div className="flex w-full justify-between px-6 sm:px-0">
      <div>
        <h1>Ocupaciones</h1>
        <p className="text-muted-foreground text-sm">
          Registra y gestiona las ocupaciones de la playa
        </p>
      </div>

      <div className="flex items-center gap-2">
        {/* Botón desktop */}
        {hasTurnoActivo ? (
          <Link
            href="/admin/ocupaciones/nueva"
            className={cn(
              buttonVariants({ variant: 'default' }),
              'hidden w-fit sm:flex'
            )}
          >
            Registrar ingreso
          </Link>
        ) : (
          <Button
            variant="default"
            className="hidden w-fit sm:flex"
            onClick={handleClickWithoutTurno}
            disabled={turnoLoading}
          >
            Registrar ingreso
          </Button>
        )}

        {/* Botón móvil (FAB - Floating Action Button) */}
        {hasTurnoActivo ? (
          <Link
            href="/admin/ocupaciones/nueva"
            className={cn(
              buttonVariants({ variant: 'default' }),
              'fixed right-6 bottom-6 z-20 h-12 w-12 rounded-full p-2 sm:hidden'
            )}
          >
            <PlusIcon className="size-6" />
          </Link>
        ) : (
          <Button
            variant="default"
            className="fixed right-6 bottom-6 z-20 h-12 w-12 rounded-full p-2 sm:hidden"
            onClick={handleClickWithoutTurno}
            disabled={turnoLoading}
          >
            <PlusIcon className="size-6" />
          </Button>
        )}
      </div>
    </div>
  )
}
