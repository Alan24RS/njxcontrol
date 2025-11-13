import { Suspense } from 'react'

import { notFound } from 'next/navigation'

import type { Metadata } from 'next'

import { PageContainer } from '@/components/layout'
import { BreadcrumbItem } from '@/components/layout/Breadcrumb'
import { Spinner } from '@/components/ui/spinner'
import { getAuthenticatedUser } from '@/lib/supabase/server'
import { getTipoPlaza } from '@/services/tipos-plaza'
import { generateSyncMetadata } from '@/utils/metadata'

import TipoPlazaDetailForm from './components/TipoPlazaDetailForm'

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params

  const tipoPlazaId = parseInt(id)
  if (isNaN(tipoPlazaId)) {
    return generateSyncMetadata({
      title: 'Tipo de Plaza no encontrado',
      description: 'El tipo de plaza solicitado no existe',
      pageRoute: `/admin/tipos-plaza/${id}`
    })
  }

  const { data: tipoPlaza } = await getTipoPlaza(tipoPlazaId)

  return generateSyncMetadata({
    title: tipoPlaza
      ? `Tipo de Plaza: ${tipoPlaza.nombre}`
      : 'Tipo de Plaza no encontrado',
    description: tipoPlaza?.descripcion || 'Detalles del tipo de plaza',
    pageRoute: `/admin/tipos-plaza/${id}`
  })
}

export default async function TipoPlazaDetailPage({ params }: Props) {
  const { id } = await params

  const tipoPlazaId = parseInt(id)
  if (isNaN(tipoPlazaId)) {
    notFound()
  }

  const { data: tipoPlaza, error } = await getTipoPlaza(tipoPlazaId)

  if (error || !tipoPlaza) {
    notFound()
  }

  const user = await getAuthenticatedUser()

  const breadcrumb: BreadcrumbItem[] = [
    { label: 'Tipos de Plaza', href: '/admin/tipos-plaza' },
    {
      label: tipoPlaza.nombre,
      href: `/admin/tipos-plaza/${id}`
    }
  ]

  const isDueno = user?.roles.includes('DUENO') || false

  return (
    <PageContainer className="space-y-6 sm:px-6" breadcrumb={breadcrumb}>
      <div className="px-6 sm:px-0">
        <h1 className="text-2xl font-bold">{tipoPlaza.nombre}</h1>
        <p className="text-muted-foreground">
          {isDueno
            ? 'Revisa y edita la información del tipo de plaza'
            : 'Revisa la información del tipo de plaza'}
        </p>
      </div>

      <Suspense
        fallback={
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        }
      >
        <TipoPlazaDetailForm tipoPlaza={tipoPlaza} roles={user?.roles || []} />
      </Suspense>
    </PageContainer>
  )
}
