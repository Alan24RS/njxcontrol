import type { Metadata } from 'next'

import {
  ActionContainer,
  TableContainer,
  ToolbarContainer
} from '@/app/admin/plazas/components'
import { PageContainer, PageHeader } from '@/components/layout'
import { PlazaEstado } from '@/constants/plazaEstado'
import { getAuthenticatedUser } from '@/lib/supabase/server'
import type { PaginationParams } from '@/types/api'
import { generateSyncMetadata } from '@/utils/metadata'
import { formatParams } from '@/utils/queryParams'

export type PageParams = PaginationParams & {
  playaId?: string
  tipoPlaza?: number
  estado?: PlazaEstado
}

export const metadata: Metadata = generateSyncMetadata({
  title: 'Plazas',
  description: 'Gestión de plazas de estacionamiento',
  pageRoute: '/admin/plazas'
})

export default async function PlazasPage({
  searchParams
}: {
  searchParams: SearchParamsType
}) {
  const params = formatParams<PageParams>(await searchParams)
  const user = await getAuthenticatedUser()

  return (
    <PageContainer className="space-y-4 sm:px-6">
      <PageHeader
        title="Plazas"
        description="Gestión de plazas de estacionamiento"
      >
        <ActionContainer />
      </PageHeader>
      <ToolbarContainer params={params} />
      <TableContainer params={params} roles={user?.roles || []} />
    </PageContainer>
  )
}
