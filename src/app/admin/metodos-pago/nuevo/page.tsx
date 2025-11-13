import { redirect } from 'next/navigation'

import { PageContainer, PageHeader } from '@/components/layout'
import { ROL } from '@/constants/rol'
import { getAuthenticatedUser } from '@/lib/supabase/server'

import CreateMetodoPagoForm from './components/CreateMetodoPagoForm'

export default async function NuevoMetodoPagoPage() {
  const user = await getAuthenticatedUser()
  const isDueno = user?.roles.includes(ROL.DUENO) || false

  if (!isDueno) {
    redirect('/admin/metodos-pago')
  }

  return (
    <PageContainer className="space-y-4 sm:px-6">
      <PageHeader
        title="Agregar método de pago"
        description="Agrega un nuevo método de pago para la playa seleccionada"
      />
      <CreateMetodoPagoForm />
    </PageContainer>
  )
}
