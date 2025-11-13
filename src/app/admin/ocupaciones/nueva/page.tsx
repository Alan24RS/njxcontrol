import { Link } from 'next-view-transitions'

import type { Metadata } from 'next'

import { PageContainer, PageHeader } from '@/components/layout'
import { BreadcrumbItem } from '@/components/layout/Breadcrumb'
import { buttonVariants } from '@/components/ui/button'
import { MessageCard } from '@/components/ui/MessageCard'
import { ROL } from '@/constants/rol'
import { getAuthenticatedUser } from '@/lib/supabase/server'
import { getTurno } from '@/services/turnos'
import { generateSyncMetadata } from '@/utils/metadata'

import CreateOcupacionForm from './components/CreateOcupacionForm'

export const metadata: Metadata = generateSyncMetadata({
  title: 'Registrar ingreso',
  description: 'Registra el ingreso de un vehículo a la playa',
  pageRoute: '/admin/ocupaciones/nueva'
})

const breadcrumb: BreadcrumbItem[] = [
  { label: 'Ocupaciones', href: '/admin/ocupaciones' },
  {
    label: 'Registrar ingreso',
    href: `/admin/ocupaciones/nueva`
  }
]

export default async function NuevaOcupacionPage() {
  const user = await getAuthenticatedUser()

  if (!user?.roles.includes(ROL.PLAYERO)) {
    return (
      <PageContainer breadcrumb={breadcrumb}>
        <MessageCard
          title="Solo los playeros pueden registrar ingresos"
          description="Esta funcionalidad está reservada para usuarios con rol de playero. Si eres dueño de una playa y deseas trabajar como playero, puedes auto-invitarte desde la sección de Playeros."
        >
          <div className="flex justify-center">
            <Link className={buttonVariants()} href="/admin/playeros">
              Ir a Playeros
            </Link>
          </div>
        </MessageCard>
      </PageContainer>
    )
  }

  const { error } = await getTurno({ activo: true })

  if (error) {
    return (
      <PageContainer breadcrumb={breadcrumb}>
        <MessageCard
          title="No tienes ningún turno activo"
          description="Para registrar un ingreso, debes tener un turno activo"
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

  return (
    <PageContainer className="space-y-6 sm:px-6" breadcrumb={breadcrumb}>
      <PageHeader
        title="Registrar ingreso"
        description="Completa los datos del vehículo y selecciona el espacio disponible"
      />
      <CreateOcupacionForm />
    </PageContainer>
  )
}
