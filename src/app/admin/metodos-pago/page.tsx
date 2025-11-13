import { Suspense } from 'react'

import {
  ActionContainer,
  TableContainer
} from '@/app/admin/metodos-pago/components'
import { PageContainer, PageHeader } from '@/components/layout'
import { Spinner } from '@/components/ui/spinner'
import { getAuthenticatedUser } from '@/lib/supabase/server'
import type { PaginationParams } from '@/types/api'
import { formatParams, generateTags } from '@/utils/queryParams'

export type PageParams = PaginationParams & {}

export default async function MetodosPagoPage({
  searchParams
}: {
  searchParams: SearchParamsType
}) {
  const params = formatParams<PageParams>(await searchParams)
  const user = await getAuthenticatedUser()

  const tags = generateTags(params)
  const joinedTags = tags.join()

  return (
    <PageContainer className="space-y-4 sm:px-6">
      <PageHeader
        title="Métodos de pago"
        description="Gestión de métodos de pago"
      >
        <ActionContainer />
      </PageHeader>
      <Suspense
        key={joinedTags}
        fallback={
          <div className="absolute top-0 left-0 z-10 grid h-full w-full place-content-center">
            <Spinner />
          </div>
        }
      >
        <TableContainer params={params} roles={user?.roles || []} />
      </Suspense>
    </PageContainer>
  )
}
