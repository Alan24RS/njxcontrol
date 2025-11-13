import { Metadata } from 'next'

import { PageContainer, PageHeader } from '@/components/layout'
import { getAuthenticatedUser } from '@/lib/supabase/server'
import { getPlayeros } from '@/services/playeros'
import type { PaginationParams, SearchParamsType } from '@/types/params'
import { generateSyncMetadata } from '@/utils/metadata'
import { formatParams } from '@/utils/queryParams'

import ActionButton from './components/ActionButton'
import TableContainer from './components/TableContainer'

export type PageParams = PaginationParams & {}

export const metadata: Metadata = generateSyncMetadata({
  title: 'Playeros',
  description: 'Gestión de playeros',
  pageRoute: '/admin/playeros'
})

export default async function PlayerosPage({
  searchParams
}: {
  searchParams: SearchParamsType
}) {
  const user = await getAuthenticatedUser()
  const params = formatParams<PageParams>(await searchParams)

  if (!user) {
    throw new Error('Usuario no autenticado')
  }

  // Obtener playeros directamente en el servidor
  const response = await getPlayeros(params)

  return (
    <PageContainer className="space-y-4 sm:px-6">
      <PageHeader
        title="Playeros"
        description="Gestiona todos los playeros de tus playas"
      >
        <ActionButton />
      </PageHeader>
      <TableContainer
        params={params}
        user={user}
        response={response}
        error={response?.error || null}
        isLoading={false}
        isError={!!response?.error}
      />
    </PageContainer>
  )
}
