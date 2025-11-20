import { redirect } from 'next/navigation'

import { PageContainer, PageHeader } from '@/components/layout'
import { ROL } from '@/constants/rol'
import { getAuthenticatedUser } from '@/lib/supabase/server'
import { getReporteOcupacionesPorTurno } from '@/services/reportes'

import { ReportesOcupacionesContent } from './components/ReportesOcupacionesContent'

export default async function ReportesOcupacionesPage() {
  const user = await getAuthenticatedUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Verificar que el usuario sea DUENO
  if (!user.roles.includes(ROL.DUENO)) {
    redirect('/admin')
  }

  const { data: reportes, error } = await getReporteOcupacionesPorTurno()

  return (
    <PageContainer className="px-6">
      <PageHeader
        title="Reportes de Ocupaciones por Turno"
        description="Visualiza las estadísticas de ocupaciones segmentadas por turnos de trabajo"
      />
      <ReportesOcupacionesContent reportes={reportes || []} error={error} />
    </PageContainer>
  )
}
