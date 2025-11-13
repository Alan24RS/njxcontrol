import { Suspense } from 'react'

import {
  HeaderContainer,
  TableContainer,
  ToolbarContainer
} from '@/app/admin/turnos/components'
import { PageContainer } from '@/components/layout'
import { Spinner } from '@/components/ui'
import type { PaginationParams } from '@/types/api'
import { formatParams } from '@/utils/queryParams'

export type PageParams = PaginationParams & {
  playaId?: string
  fromDate?: string
  toDate?: string
}

export default async function TurnosPage({
  searchParams
}: {
  searchParams: any
}) {
  const params = formatParams<PageParams>(await searchParams)

  return (
    <PageContainer className="space-y-4 sm:px-6">
      <Suspense
        fallback={
          <div className="bg-muted h-24 w-full animate-pulse rounded-md" />
        }
      >
        <HeaderContainer />
        <ToolbarContainer params={params} />
      </Suspense>

      <Suspense
        fallback={
          <div className="flex w-full grow items-center justify-center">
            <Spinner />
          </div>
        }
      >
        <TableContainer params={params} />
      </Suspense>
    </PageContainer>
  )
}
