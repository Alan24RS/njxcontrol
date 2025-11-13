import { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { PageContainer, PageHeader } from '@/components/layout'
import { BreadcrumbItem } from '@/components/layout/Breadcrumb'
import { getPlaya } from '@/services/playas'
import { generateSyncMetadata } from '@/utils/metadata'

import PlayaDetailForm from './components/PlayaDetailForm'
import PlayaStatusCard from './components/PlayaStatusCard'

interface PlayaDetailPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({
  params
}: PlayaDetailPageProps): Promise<Metadata> {
  const { id } = await params
  let title = 'Playa no encontrada'

  try {
    const { data: playa, error } = await getPlaya(id)

    if (playa && !error) {
      title = `${playa.nombre || playa.direccion}`
    }
  } catch (error) {
    console.warn('Error al generar metadata:', error)
  }

  return generateSyncMetadata({
    title,
    description: 'Visualiza y edita la información de la playa',
    pageRoute: `/admin/playas/${id}`
  })
}

export default async function PlayaDetailPage({
  params
}: PlayaDetailPageProps) {
  const { id } = await params
  const { data: playa, error } = await getPlaya(id)

  if (error || !playa) {
    notFound()
  }

  const breadcrumb: BreadcrumbItem[] = [
    { label: 'Playas', href: '/admin/playas' },
    { label: playa.nombre || playa.direccion, href: `/admin/playas/${id}` }
  ]

  return (
    <PageContainer className="space-y-6 sm:px-6" breadcrumb={breadcrumb}>
      <PageHeader
        title={playa.nombre || 'Playa sin nombre'}
        description="Visualiza y edita la información de la playa"
      />

      <PlayaStatusCard playaId={playa.id} currentEstado={playa.estado} />

      <PlayaDetailForm playa={playa} />
    </PageContainer>
  )
}
