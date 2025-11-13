import { notFound } from 'next/navigation'

import type { Metadata } from 'next'

import { PageContainer, PageHeader } from '@/components/layout'
import { BreadcrumbItem } from '@/components/layout/Breadcrumb'
import { getOcupacionById } from '@/services/ocupaciones'
import { generateSyncMetadata } from '@/utils/metadata'

import EditOcupacionForm from './components/EditOcupacionForm'

export const metadata: Metadata = generateSyncMetadata({
  title: 'Editar ocupación',
  description: 'Modifica los datos de una ocupación activa',
  pageRoute: '/admin/ocupaciones/editar'
})

export default async function EditarOcupacionPage({
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
      label: ocupacion ? `Editar ${ocupacion.patente}` : 'Editar ocupación',
      href: `/admin/ocupaciones/${id}/editar`
    }
  ]

  return (
    <PageContainer className="space-y-6 sm:px-6" breadcrumb={breadcrumb}>
      <PageHeader
        title={
          ocupacion
            ? `Editar ocupación - ${ocupacion.patente}`
            : 'Editar ocupación'
        }
        description={
          ocupacion
            ? `Plaza ${ocupacion.plazaIdentificador} · ${ocupacion.playaNombre}`
            : 'Modifica los datos del vehículo o la plaza asignada'
        }
      />

      <EditOcupacionForm ocupacionId={id} />
    </PageContainer>
  )
}
