import type { Metadata } from 'next'

import { PageContainer } from '@/components/layout'
import { getAuthenticatedUser } from '@/lib/supabase/server'
import type { PaginationParams } from '@/types/api'
import { generateSyncMetadata } from '@/utils/metadata'
import { formatParams } from '@/utils/queryParams'

import { HeaderContainer, TableContainer } from './components'

export const metadata: Metadata = generateSyncMetadata({
  title: 'Ocupaciones',
  description: 'Gestión de ocupaciones de estacionamiento',
  pageRoute: '/admin/ocupaciones'
})

export type PageParams = PaginationParams

export default async function OcupacionesPage({
  searchParams
}: {
  searchParams: SearchParamsType
}) {
  const params = formatParams<PageParams>(await searchParams)
  const user = await getAuthenticatedUser()

  return (
    <PageContainer className="space-y-4 sm:px-6">
      <HeaderContainer user={user} />
      <TableContainer params={params} user={user} />
    </PageContainer>
  )
}
