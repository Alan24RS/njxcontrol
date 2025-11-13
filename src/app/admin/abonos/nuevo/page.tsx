import type { Metadata } from 'next'

import { PageContainer, PageHeader } from '@/components/layout'
import { BreadcrumbItem } from '@/components/layout/Breadcrumb'
import { MessageCard } from '@/components/ui/MessageCard'
import { ROL } from '@/constants/rol'
import { getAuthenticatedUser } from '@/lib/supabase/server'
import { getModalidadAbonoStatus } from '@/services/modalidades-ocupacion'
import { hasTarifasAbono } from '@/services/tarifas'
import { getTurno } from '@/services/turnos'
import { generateSyncMetadata } from '@/utils/metadata'

import CreateAbonoWizard from './components/CreateAbonoWizard'

export const metadata: Metadata = generateSyncMetadata({
  title: 'Crear nuevo abono',
  description: 'Crea un abono mensual para un cliente regular',
  pageRoute: '/admin/abonos/nuevo'
})

const breadcrumb: BreadcrumbItem[] = [
  { label: 'Abonos', href: '/admin/abonos' },
  {
    label: 'Crear abono',
    href: `/admin/abonos/nuevo`
  }
]

export default async function NuevoAbonoPage() {
  const user = await getAuthenticatedUser()

  if (!user?.roles.includes(ROL.PLAYERO)) {
    return (
      <PageContainer breadcrumb={breadcrumb}>
        <MessageCard
          title="Solo los playeros pueden crear abonos"
          description="Esta funcionalidad está reservada para usuarios con rol de playero."
          content="Si eres dueño de una playa y deseas trabajar como playero, puedes auto-invitarte desde la sección de Playeros."
          type="warning"
          actionLink={{
            label: 'Ir a la sección de Playeros',
            href: '/admin/playeros'
          }}
        />
      </PageContainer>
    )
  }

  const { data: turno, error } = await getTurno({ activo: true })

  if (error) {
    return (
      <PageContainer breadcrumb={breadcrumb}>
        <MessageCard
          title="No tienes ningún turno activo"
          description="Para crear un abono, debes tener un turno activo"
          type="warning"
          content="Si no tienes un turno activo, puedes iniciar uno en la sección de Turnos."
          actionLink={{
            label: 'Iniciar turno',
            href: '/admin/turnos/iniciar-turno'
          }}
        />
      </PageContainer>
    )
  }

  if (!turno?.playaId) {
    return (
      <PageContainer breadcrumb={breadcrumb}>
        <MessageCard
          title="Error al obtener playa del turno"
          description="No se pudo determinar la playa del turno activo"
        />
      </PageContainer>
    )
  }

  const modalidadStatus = await getModalidadAbonoStatus(turno.playaId)

  if (!modalidadStatus.exists) {
    return (
      <PageContainer breadcrumb={breadcrumb}>
        <MessageCard
          title="Abonos no habilitados"
          description="Esta playa no tiene habilitada la modalidad de abono"
          content="Para poder crear abonos, primero debes habilitar la modalidad de abono en la sección de Modalidades."
          type="warning"
          actionLink={{
            label: 'Ir a la sección de Modalidades',
            href: '/admin/modalidades-ocupacion'
          }}
        />
      </PageContainer>
    )
  }

  if (!modalidadStatus.isActive) {
    return (
      <PageContainer breadcrumb={breadcrumb}>
        <MessageCard
          title="Modalidad de abono inactiva"
          description="No se pueden crear nuevos abonos mientras la modalidad esté inactiva"
          content="Para poder crear abonos, primero debes activar la modalidad de abono en la sección de Modalidades."
          type="warning"
          actionLink={{
            label: 'Ir a la sección de Modalidades',
            href: '/admin/modalidades-ocupacion'
          }}
        />
      </PageContainer>
    )
  }

  const existenTarifas = await hasTarifasAbono(turno.playaId)

  if (!existenTarifas) {
    return (
      <PageContainer breadcrumb={breadcrumb}>
        <MessageCard
          title="No existen tarifas para abonos"
          description="No se pueden crear abonos sin tarifas configuradas"
          content="Para poder crear abonos, primero debes configurar al menos una tarifa con modalidad de abono en la sección de Tarifas."
          type="warning"
          actionLink={{
            label: 'Ir a configurar tarifas',
            href: '/admin/tarifas'
          }}
        />
      </PageContainer>
    )
  }

  return (
    <PageContainer className="space-y-6 sm:px-6" breadcrumb={breadcrumb}>
      <PageHeader
        title="Crear abono"
        description="Crea un abono mensual para un cliente regular"
      />

      <CreateAbonoWizard />
    </PageContainer>
  )
}
