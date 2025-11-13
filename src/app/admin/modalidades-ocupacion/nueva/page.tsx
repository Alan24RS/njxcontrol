import { redirect } from 'next/navigation'

import { PageContainer, PageHeader } from '@/components/layout'
import { ROL } from '@/constants/rol'
import { getAuthenticatedUser } from '@/lib/supabase/server'

import CreateModalidadOcupacionForm from './components/CreateModalidadOcupacionForm'

export default async function NuevaModalidadOcupacionPage() {
  const user = await getAuthenticatedUser()
  const isDueno = user?.roles.includes(ROL.DUENO) || false

  if (!isDueno) {
    redirect('/admin/modalidades-ocupacion')
  }

  return (
    <PageContainer className="space-y-6 sm:px-6">
      <PageHeader
        title="Agregar modalidad de ocupación"
        description="Agrega una nueva modalidad de ocupación para la playa seleccionada"
      />
      <CreateModalidadOcupacionForm />
    </PageContainer>
  )
}
