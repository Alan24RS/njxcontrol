import {
  ActionContainer,
  TableContainer,
  ToolbarContainer
} from '@/app/admin/playas/components'
import { PageContainer, PageHeader } from '@/components/layout'
import type { PaginationParams } from '@/types/api'
import { formatParams } from '@/utils/queryParams'

export type PageParams = PaginationParams

export default async function PlayasPage({
  searchParams
}: {
  searchParams: SearchParamsType
}) {
  const params = formatParams<PageParams>(await searchParams)

  return (
    <PageContainer className="space-y-4 sm:px-6">
      <PageHeader title="Playas" description="Gestiona todas las playas">
        <ActionContainer />
      </PageHeader>
      <ToolbarContainer params={params} />
      <TableContainer params={params} />
    </PageContainer>
  )
}
