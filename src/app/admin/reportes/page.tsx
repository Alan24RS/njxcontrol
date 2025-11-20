import { redirect } from 'next/navigation'

import { PageContainer, PageHeader } from '@/components/layout'
import { ROL } from '@/constants/rol'
import { getAuthenticatedUser } from '@/lib/supabase/server'
import { getReporteAbonosVigentes } from '@/services/reportes'

import { ReportesContent } from './components/ReportesContent'

export default async function ReportesPage() {
  const user = await getAuthenticatedUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Verificar que el usuario sea DUENO
  if (!user.roles.includes(ROL.DUENO)) {
    redirect('/admin')
  }

  const { data: reportes, error } = await getReporteAbonosVigentes()

  return (
    <PageContainer className="px-6">
      <PageHeader
        title="Reportes de Abonos"
        description="Visualiza la cantidad de abonos vigentes en tus playas"
      />
      <ReportesContent reportes={reportes || []} error={error} />
    </PageContainer>
  )
}
