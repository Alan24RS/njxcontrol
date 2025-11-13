import { Suspense } from 'react'

import { Metadata } from 'next'

import { PageContainer } from '@/components/layout'
import { Spinner } from '@/components/ui'
import { generateSyncMetadata } from '@/utils/metadata'

import EstadoPlazasContainer from './components/EstadoPlazasContainer'

export const metadata: Metadata = generateSyncMetadata({
  title: 'Estado de Plazas',
  description:
    'Visualiza la disponibilidad de todas las plazas en tiempo real.',
  pageRoute: '/admin/plazas/estado'
})

export default async function EstadoPlazasPage() {
  return (
    <PageContainer className="space-y-4 sm:px-6">
      <div className="flex w-full justify-between px-6 sm:px-0">
        <h1>Estado de Plazas</h1>
      </div>

      <Suspense
        fallback={
          <div className="flex w-full grow items-center justify-center">
            <Spinner />
          </div>
        }
      >
        <EstadoPlazasContainer />
      </Suspense>
    </PageContainer>
  )
}
