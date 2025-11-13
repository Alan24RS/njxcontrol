import { redirect } from 'next/navigation'

import { PageContainer, PageHeader } from '@/components/layout'
import { ROL } from '@/constants/rol'
import { getAuthenticatedUser } from '@/lib/supabase/server'

import CreateTipoVehiculoForm from './components/CreateTipoVehiculoForm'

export default async function NuevoTipoVehiculoPage() {
  const user = await getAuthenticatedUser()
  const isDueno = user?.roles.includes(ROL.DUENO) || false

  if (!isDueno) {
    redirect('/admin/tipos-vehiculo')
  }

  return (
    <PageContainer className="space-y-4 sm:px-6">
      <PageHeader
        title="Agregar tipo de vehículo"
        description="Agrega un nuevo tipo de vehículo para la playa seleccionada"
      />
      <CreateTipoVehiculoForm />
    </PageContainer>
  )
}
