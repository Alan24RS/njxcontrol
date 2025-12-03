import { Suspense } from 'react'

import Link from 'next/link'

import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

import AbonoDetails from './components/AbonoDetails'

export const metadata = {
  title: 'Detalle del Abono | Admin',
  description: 'Información completa del abono'
}

interface AbonoPageProps {
  params: Promise<{
    playaId: string
    plazaId: string
    fechaHoraInicio: string
  }>
}

export default async function AbonoPage({ params }: AbonoPageProps) {
  const { playaId, plazaId, fechaHoraInicio } = await params
  const decodedFecha = decodeURIComponent(fechaHoraInicio)

  return (
    <div className="container mx-auto space-y-6 py-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/abonos">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Detalle del Abono
          </h1>
          <p className="text-muted-foreground">
            Información completa y gestión del abono
          </p>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="flex items-center justify-center p-8">
            <Spinner className="h-6 w-6" />
          </div>
        }
      >
        <AbonoDetails
          playaId={playaId}
          plazaId={plazaId}
          fechaHoraInicio={decodedFecha}
        />
      </Suspense>
    </div>
  )
}
