import { redirect } from 'next/navigation'

import { PageContainer, PageHeader } from '@/components/layout'
import { MessageCard } from '@/components/ui/MessageCard'
import { ROL } from '@/constants/rol'
import { getAuthenticatedUser } from '@/lib/supabase/server'
import { getTurno } from '@/services/turnos'

import { ReporteTurnoActualContent } from './components/ReporteTurnoActualContent'

export default async function ReporteTurnoActualPage() {
  const user = await getAuthenticatedUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Solo playeros pueden ver esta página
  const esPlayero = user.roles.includes(ROL.PLAYERO)

  if (!esPlayero) {
    return (
      <PageContainer className="px-6">
        <MessageCard
          title="Acceso restringido"
          description="Esta página es exclusiva para playeros con turno activo"
          content="Los dueños pueden ver reportes históricos en la sección de Reportes Mensuales."
          type="warning"
          actionLink={{
            href: '/admin/reportes/pagos-mensuales',
            label: 'Ir a Reportes Mensuales'
          }}
        />
      </PageContainer>
    )
  }

  // Obtener turno activo
  const { data: turnoActivo, error: turnoError } = await getTurno({
    activo: true
  })

  if (turnoError || !turnoActivo) {
    return (
      <PageContainer className="px-6">
        <MessageCard
          title="No tienes un turno activo"
          description="Para ver el reporte del turno actual necesitas tener un turno iniciado"
          content="Inicia un turno desde la sección de Turnos para comenzar a registrar pagos."
          type="info"
          actionLink={{
            href: '/admin/turnos/iniciar-turno',
            label: 'Iniciar Turno'
          }}
        />
      </PageContainer>
    )
  }

  return (
    <PageContainer className="px-6">
      <PageHeader
        title="Reporte del Turno Actual"
        description="Visualiza en tiempo real los pagos registrados en tu turno activo"
      />
      <ReporteTurnoActualContent turno={turnoActivo} />
    </PageContainer>
  )
}
