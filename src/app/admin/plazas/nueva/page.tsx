import { redirect } from 'next/navigation'

import { PageContainer } from '@/components/layout'
import { ROL } from '@/constants/rol'
import { getAuthenticatedUser } from '@/lib/supabase/server'

import CreatePlazaForm from './components/CreatePlazaForm'

export default async function NuevaPlazaPage() {
  const user = await getAuthenticatedUser()
  const isDueno = user?.roles.includes(ROL.DUENO) || false

  if (!isDueno) {
    redirect('/admin/plazas')
  }

  return (
    <PageContainer className="px-6">
      <div className="max-w-2xl">
        <div className="mb-8">
          <h1>Registrar nueva plaza</h1>
          <p className="text-muted-foreground mt-2">
            Crea una nueva plaza de estacionamiento para la playa seleccionada.
            La plaza se creará en estado activo por defecto.
          </p>
        </div>

        <CreatePlazaForm />
      </div>
    </PageContainer>
  )
}
