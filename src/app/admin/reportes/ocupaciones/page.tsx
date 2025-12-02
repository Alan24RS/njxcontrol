import { redirect } from 'next/navigation'

import { PageContainer, PageHeader } from '@/components/layout'
import { ROL } from '@/constants/rol'
import { getAuthenticatedUser } from '@/lib/supabase/server'
import { getReporteOcupacionesPorTurno } from '@/services/reportes'

import { ReportesOcupacionesContent } from './components/ReportesOcupacionesContent'

interface SearchParams {
  playa?: string
  fechaDesde?: string
  fechaHasta?: string
}

export default async function ReportesOcupacionesPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>
}) {
  const user = await getAuthenticatedUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Verificar que el usuario sea DUENO o PLAYERO
  const esDueno = user.roles.includes(ROL.DUENO)
  const esPlayero = user.roles.includes(ROL.PLAYERO)

  if (!esDueno && !esPlayero) {
    redirect('/admin')
  }

  const params = await searchParams
  const { data: reportes, error } = await getReporteOcupacionesPorTurno(
    params.playa,
    params.fechaDesde,
    params.fechaHasta
  )

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
