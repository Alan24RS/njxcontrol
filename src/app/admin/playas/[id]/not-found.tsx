import { Link } from 'next-view-transitions'

import { ArrowLeft, MapPin } from 'lucide-react'

import { buttonVariants } from '@/components/ui'
import { cn } from '@/lib/utils'

export default function PlayaNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-6 px-4 text-center">
      <div className="space-y-2">
        <div className="bg-muted mx-auto flex h-20 w-20 items-center justify-center rounded-full">
          <MapPin className="text-muted-foreground h-10 w-10" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">
          Playa no encontrada
        </h1>
        <p className="text-muted-foreground max-w-md">
          La playa que estás buscando no existe o ha sido eliminada. Verifica el
          ID o regresa a la lista de playas.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/admin/playas"
          className={cn(
            buttonVariants({ variant: 'outline' }),
            'flex items-center gap-2'
          )}
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a playas
        </Link>
      </div>
    </div>
  )
}
