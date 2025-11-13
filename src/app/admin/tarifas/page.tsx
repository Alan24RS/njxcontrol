import type { Metadata } from 'next'

import {
  ActionContainer,
  TableContainer,
  ToolbarContainer
} from '@/app/admin/tarifas/components'
import { PageContainer, PageHeader } from '@/components/layout'
import { getAuthenticatedUser } from '@/lib/supabase/server'
import type { PaginationParams } from '@/types/api'
import { generateSyncMetadata } from '@/utils/metadata'
import { formatParams } from '@/utils/queryParams'

export type PageParams = PaginationParams & {
  playaId?: string
  tipoPlaza?: number
  modalidadOcupacion?: string
  tipoVehiculo?: string
}

export const metadata: Metadata = generateSyncMetadata({
  title: 'Tarifas',
  description: 'Gestión de tarifas de estacionamiento',
  pageRoute: '/admin/tarifas'
})

export default async function TarifasPage({
  searchParams
}: {
  searchParams: SearchParamsType
}) {
  const params = formatParams<PageParams>(await searchParams)
  const user = await getAuthenticatedUser()

  return (
    <PageContainer className="space-y-4 sm:px-6">
      <PageHeader
        title="Tarifas"
        description="Gestión de tarifas de estacionamiento"
      >
        <ActionContainer />
      </PageHeader>
      <ToolbarContainer params={params} />
      <TableContainer params={params} roles={user?.roles || []} />
    </PageContainer>
  )
}
