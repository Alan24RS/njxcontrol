import { redirect } from 'next/navigation'

import { PageContainer, PageHeader } from '@/components/layout'
import { ROL } from '@/constants/rol'
import { getAuthenticatedUser } from '@/lib/supabase/server'

import { ReportesPlayaActualContent } from './components/ReportesPlayaActualContent'

export default async function ReportesPlayaActualPage() {
  const user = await getAuthenticatedUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Solo playeros pueden ver esta página
  const esPlayero = user.roles.includes(ROL.PLAYERO)

  if (!esPlayero) {
    redirect('/admin/reportes')
  }

  return (
    <PageContainer className="px-6">
      <PageHeader
        title="Reportes de Playa Actual"
        description="Selecciona el tipo de reporte que deseas consultar"
      />
      <ReportesPlayaActualContent />
    </PageContainer>
  )
}
