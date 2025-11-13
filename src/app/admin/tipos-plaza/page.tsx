import { PageContainer, PageHeader } from '@/components/layout'
import { getAuthenticatedUser } from '@/lib/supabase/server'
import type { PaginationParams } from '@/types/api'
import { formatParams } from '@/utils/queryParams'

import { ActionContainer, TableContainer, ToolbarContainer } from './components'

export type PageParams = PaginationParams & {
  caracteristicas?: number[]
}

export default async function TiposPlazasPage({
  searchParams
}: {
  searchParams: SearchParamsType
}) {
  const params = formatParams<PageParams>(await searchParams)
  const user = await getAuthenticatedUser()

  return (
    <PageContainer className="space-y-4 sm:px-6">
      <PageHeader
        title="Tipos de plazas"
        description="Gestión de tipos de plazas"
      >
        <ActionContainer />
      </PageHeader>
      <ToolbarContainer params={params} />
      <TableContainer params={params} roles={user?.roles || []} />
    </PageContainer>
  )
}
