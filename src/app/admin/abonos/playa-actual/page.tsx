import type { Metadata } from 'next'

import {
  ActionContainer,
  TableContainer
} from '@/app/admin/abonos/playa-actual/components'
import { PageContainer, PageHeader } from '@/components/layout'
import { generateSyncMetadata } from '@/utils/metadata'

export const metadata: Metadata = generateSyncMetadata({
  title: 'Abonos - Playa Actual',
  description: 'Gestión de abonos de la playa actual',
  pageRoute: '/admin/abonos/playa-actual'
})

export default function AbonosPlayaActualPage() {
  return (
    <PageContainer className="space-y-4 sm:px-6">
      <PageHeader
        title="Abonos - Playa Actual"
        description="Gestión de abonos de la playa actual"
      >
        <ActionContainer />
      </PageHeader>
      <TableContainer />
    </PageContainer>
  )
}
