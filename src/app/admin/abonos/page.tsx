import type { Metadata } from 'next'

import { ActionContainer, TableContainer } from '@/app/admin/abonos/components'
import { PageContainer, PageHeader } from '@/components/layout'
import { generateSyncMetadata } from '@/utils/metadata'

export const metadata: Metadata = generateSyncMetadata({
  title: 'Abonos',
  description: 'Gestión de abonos mensuales',
  pageRoute: '/admin/abonos'
})

export default function AbonosPage() {
  return (
    <PageContainer className="space-y-4 sm:px-6">
      <PageHeader title="Abonos" description="Gestión de abonos mensuales">
        <ActionContainer />
      </PageHeader>
      <TableContainer />
    </PageContainer>
  )
}
