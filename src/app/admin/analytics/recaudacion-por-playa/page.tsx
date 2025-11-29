import { Suspense } from 'react'

import type { Metadata } from 'next'

import { Skeleton } from '@/components/ui/skeleton'

import { RecaudacionPorPlayaContent } from './RecaudacionPorPlayaContent'

export const metadata: Metadata = {
  title: 'Recaudación por Playa | Analytics',
  description: 'Reporte de recaudación mensual agrupado por playa'
}

export default function RecaudacionPorPlayaPage() {
  return (
    <div className="container mx-auto space-y-6 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Recaudación por Playa</h1>
          <p className="text-muted-foreground">
            Análisis de ingresos mensuales agrupados por ubicación
          </p>
        </div>
      </div>

      <Suspense fallback={<RecaudacionSkeleton />}>
        <RecaudacionPorPlayaContent />
      </Suspense>
    </div>
  )
}

function RecaudacionSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-[400px] w-full" />
      <Skeleton className="h-[500px] w-full" />
    </div>
  )
}
