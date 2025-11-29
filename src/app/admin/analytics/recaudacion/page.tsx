import { Suspense } from 'react'

import type { Metadata } from 'next'

import { PageContainer, PageHeader } from '@/components/layout'
import { BreadcrumbItem } from '@/components/layout/Breadcrumb'
import { Skeleton } from '@/components/ui/skeleton'

import { RecaudacionContent } from './RecaudacionContent'

export const metadata: Metadata = {
  title: 'Recaudación | Analytics',
  description: 'Reporte de recaudación por fecha, playa y playero'
}

export default function RecaudacionPage() {
  const breadcrumb: BreadcrumbItem[] = [
    { label: 'Analytics', href: '/admin/analytics' },
    { label: 'Informe de Recaudación', href: '/admin/analytics/recaudacion' }
  ]

  return (
    <PageContainer className="space-y-6 sm:px-6" breadcrumb={breadcrumb}>
      <PageHeader
        title="Recaudación"
        description="Genera un informe detallado de la recaudación de tus playas con opciones de filtrado por fecha, tipo de ingreso(ocupacion/abono) y playero."
      />

      <Suspense fallback={<RecaudacionSkeleton />}>
        <RecaudacionContent />
      </Suspense>
    </PageContainer>
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
