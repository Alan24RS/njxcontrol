import { redirect } from 'next/navigation'

import { PageContainer } from '@/components/layout'
import { ROL } from '@/constants/rol'
import { getAuthenticatedUser } from '@/lib/supabase/server'
import { getCaracteristicas } from '@/services/caracteristicas'

import CreateTipoPlazaForm from './components/CreateTipoPlazaForm'

export default async function NuevoTipoPlazaPage() {
  const user = await getAuthenticatedUser()
  const isDueno = user?.roles.includes(ROL.DUENO) || false

  if (!isDueno) {
    redirect('/admin/tipos-plaza')
  }

  const { data } = await getCaracteristicas()
  return (
    <PageContainer className="space-y-6 sm:px-6">
      <div className="px-6 sm:px-0">
        <h1>Crear nuevo tipo de plaza</h1>
        <p className="text-muted-foreground mt-2">
          Crea un nuevo tipo de plaza con sus características específicas
        </p>
      </div>

      <CreateTipoPlazaForm caracteristicas={data ?? []} />
    </PageContainer>
  )
}
