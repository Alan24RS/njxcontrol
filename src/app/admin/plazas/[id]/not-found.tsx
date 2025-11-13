import { Link } from 'next-view-transitions'

import { AlertTriangle, ArrowLeft } from 'lucide-react'

import { PageContainer } from '@/components/layout'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function PlazaNotFound() {
  return (
    <PageContainer className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="space-y-4">
        <div className="flex justify-center">
          <AlertTriangle className="text-muted-foreground h-16 w-16" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Plaza no encontrada</h1>
          <p className="text-muted-foreground max-w-md">
            La plaza que está buscando no existe o ha sido eliminada.
          </p>
        </div>

        <div className="flex justify-center gap-2">
          <Link
            href="/admin/plazas"
            className={cn(buttonVariants({ variant: 'outline' }))}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Plazas
          </Link>
        </div>
      </div>
    </PageContainer>
  )
}
