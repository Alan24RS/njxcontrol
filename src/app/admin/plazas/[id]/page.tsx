import { Suspense } from 'react'

import { notFound } from 'next/navigation'

import type { Metadata } from 'next'

import { PageContainer } from '@/components/layout'
import { BreadcrumbItem } from '@/components/layout/Breadcrumb'
import { Spinner } from '@/components/ui/spinner'
import { getAuthenticatedUser } from '@/lib/supabase/server'
import { getPlaza } from '@/services/plazas'
import { generateSyncMetadata } from '@/utils/metadata'

import PlazaDetailForm from './components/PlazaDetailForm'

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params

  let title = 'Plaza no encontrada'

  try {
    const { data: plaza, error } = await getPlaza(id)
    if (plaza && !error) {
      title = `${plaza.identificador ? `Plaza ${plaza.identificador}` : 'Plaza'}`
    }
  } catch (error) {
    console.warn('Error al generar metadata:', error)
  }

  return generateSyncMetadata({
    title,
    description: 'Información detallada de la plaza',
    pageRoute: `/admin/plazas/${id}`
  })
}

export default async function PlazaDetailPage({ params }: Props) {
  const { id } = await params
  const { data: plaza, error } = await getPlaza(id)

  if (error || !plaza) {
    notFound()
  }

  const user = await getAuthenticatedUser()
  const isDueno = user?.roles.includes('DUENO') || false

  const breadcrumb: BreadcrumbItem[] = [
    { label: 'Plazas', href: '/admin/plazas' },
    {
      label: plaza.identificador ? `Plaza ${plaza.identificador}` : 'Plaza',
      href: `/admin/plazas/${id}`
    }
  ]

  return (
    <PageContainer className="space-y-6 sm:px-6" breadcrumb={breadcrumb}>
      <div className="px-6 sm:px-0">
        <h1 className="text-2xl font-bold">
          {plaza.identificador ? `Plaza ${plaza.identificador}` : 'Plaza'}
        </h1>
        <p className="text-muted-foreground">
          {isDueno
            ? 'Revisa y edita la información de la plaza'
            : 'Revisa la información de la plaza'}
        </p>
      </div>

      <Suspense
        fallback={
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        }
      >
        <PlazaDetailForm plaza={plaza} roles={user?.roles || []} />
      </Suspense>
    </PageContainer>
  )
}
