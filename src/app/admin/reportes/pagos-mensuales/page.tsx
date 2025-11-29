import { redirect } from 'next/navigation'

import { PageContainer, PageHeader } from '@/components/layout'
import { ROL } from '@/constants/rol'
import { getAuthenticatedUser } from '@/lib/supabase/server'
import { getReportePagosMensuales } from '@/services/reportes'

import { ReportesPagosMensualesContent } from './components/ReportesPagosMensualesContent'

interface SearchParams {
  playa?: string
  playero?: string
  anio?: string
  mes?: string
}

export default async function ReportesPagosMensualesPage({
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
  const { data: reportes, error } = await getReportePagosMensuales(
    params.playa,
    params.playero,
    params.anio ? parseInt(params.anio) : undefined,
    params.mes ? parseInt(params.mes) : undefined
  )

  return (
    <PageContainer className="px-6">
      <PageHeader
        title="Reportes de Pagos Mensuales"
        description="Visualiza la recaudación consolidada de ocupaciones y boletas por mes"
      />
      <ReportesPagosMensualesContent
        reportes={reportes || []}
        error={error}
        esDueno={esDueno}
      />
    </PageContainer>
  )
}
