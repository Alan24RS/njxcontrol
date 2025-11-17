import { TableContainer } from '@/app/admin/abonados/playa-actual/components'
import { PageContainer, PageHeader } from '@/components/layout'
import type { PaginationParams } from '@/types/api'
import { formatParams } from '@/utils/queryParams'

export type PageParams = PaginationParams & {
  fromDate?: string
  toDate?: string
  estado?: string[]
}

export default async function AbonadosPlayaActualPage({
  searchParams
}: {
  searchParams: any
}) {
  const params = formatParams<PageParams>(await searchParams)

  return (
    <PageContainer className="space-y-4 sm:px-6">
      <PageHeader
        title="Abonados - Playa Actual"
        description="Gestión de abonados de la playa actual"
      />
      <TableContainer params={params} />
    </PageContainer>
  )
}
