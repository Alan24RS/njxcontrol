import { notFound } from 'next/navigation'

import type { Metadata } from 'next'

import { PageContainer, PageHeader } from '@/components/layout'
import { BreadcrumbItem } from '@/components/layout/Breadcrumb'
import { getOcupacionById } from '@/services/ocupaciones'
import { generateSyncMetadata } from '@/utils/metadata'

import FinalizeOcupacionForm from './components/FinalizeOcupacionForm'

export const metadata: Metadata = generateSyncMetadata({
  title: 'Finalizar ocupación',
  description: 'Registra el pago de una ocupación activa',
  pageRoute: '/admin/ocupaciones/finalizar'
})

export default async function FinalizarOcupacionPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const { data: ocupacion, error } = await getOcupacionById(id)

  if (error || !ocupacion) {
    notFound()
  }

  const breadcrumb: BreadcrumbItem[] = [
    { label: 'Ocupaciones', href: '/admin/ocupaciones' },
    {
      label: ocupacion
        ? `Finalizar ${ocupacion.patente}`
        : 'Finalizar ocupación',
      href: `/admin/ocupaciones/${id}/finalizar`
    }
  ]

  return (
    <PageContainer className="space-y-6 sm:px-6" breadcrumb={breadcrumb}>
      <PageHeader
        title={
          ocupacion
            ? `Finalizar ocupación - ${ocupacion.patente}`
            : 'Finalizar ocupación'
        }
        description="Registra el pago y libera la plaza asignada"
      />

      <FinalizeOcupacionForm ocupacionId={id} />
    </PageContainer>
  )
}
