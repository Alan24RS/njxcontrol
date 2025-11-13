import { Suspense } from 'react'

import Link from 'next/link'

import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'

import BoletasTable from './components/BoletasTable'

export const metadata = {
  title: 'Boletas del Abono | Admin',
  description: 'Gestión de boletas de abono'
}

interface BoletasPageProps {
  params: Promise<{
    playaId: string
    plazaId: string
    fechaHoraInicio: string
  }>
}

export default async function BoletasPage({ params }: BoletasPageProps) {
  const { playaId, plazaId, fechaHoraInicio } = await params
  const decodedFecha = decodeURIComponent(fechaHoraInicio)

  return (
    <div className="container mx-auto space-y-6 py-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/abonos">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Boletas del Abono
          </h1>
          <p className="text-muted-foreground">
            Visualiza y gestiona los pagos de las boletas
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historial de boletas</CardTitle>
          <CardDescription>
            Listado de todas las boletas generadas para este abono
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense
            fallback={
              <div className="flex items-center justify-center p-8">
                <Spinner className="h-6 w-6" />
              </div>
            }
          >
            <BoletasTable
              playaId={playaId}
              plazaId={plazaId}
              fechaHoraInicio={decodedFecha}
            />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
