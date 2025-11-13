import { TableContainer } from '@/app/admin/abonados/components'
import { PageContainer, PageHeader } from '@/components/layout'
import type { PaginationParams } from '@/types/api'
import { formatParams } from '@/utils/queryParams'

export type PageParams = PaginationParams & {
  fromDate?: string
  toDate?: string
  estado?: string[]
}

export default async function AbonadosPage({
  searchParams
}: {
  searchParams: any
}) {
  const params = formatParams<PageParams>(await searchParams)

  return (
    <PageContainer className="space-y-4 sm:px-6">
      <PageHeader title="Abonados" description="Gestión de abonados" />
      <TableContainer params={params} />
    </PageContainer>
  )
}
