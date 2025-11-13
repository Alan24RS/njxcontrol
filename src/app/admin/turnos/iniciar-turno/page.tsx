import { Link } from 'next-view-transitions'

import { PageContainer, PageHeader } from '@/components/layout'
import { BreadcrumbItem } from '@/components/layout/Breadcrumb'
import { buttonVariants } from '@/components/ui/button'
import { MessageCard } from '@/components/ui/MessageCard'
import { ROL } from '@/constants/rol'
import { getAuthenticatedUser } from '@/lib/supabase/server'

import IniciarTurnoForm from './components/IniciarTurnoForm'

const breadcrumb: BreadcrumbItem[] = [
  { label: 'Turnos', href: '/admin/turnos' },
  {
    label: 'Iniciar Turno',
    href: `/admin/turnos/iniciar-turno`
  }
]

export default async function IniciarTurnoPage() {
  const user = await getAuthenticatedUser()

  if (!user?.roles.includes(ROL.PLAYERO)) {
    return (
      <PageContainer breadcrumb={breadcrumb}>
        <MessageCard
          title="Solo los playeros pueden iniciar turnos"
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

  return (
    <PageContainer className="space-y-6 sm:px-6" breadcrumb={breadcrumb}>
      <PageHeader title="Iniciar turno" description="Inicia un nuevo turno" />
      <IniciarTurnoForm />
    </PageContainer>
  )
}
