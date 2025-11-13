import { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { PageContainer } from '@/components/layout'
import { BreadcrumbItem } from '@/components/layout/Breadcrumb'
import { ROL } from '@/constants/rol'
import { getAuthenticatedUser } from '@/lib/supabase/server'
import { generateSyncMetadata } from '@/utils/metadata'

import CreateTarifaForm from './components/CreateTarifaForm'

export const metadata: Metadata = generateSyncMetadata({
  title: 'Crear nueva tarifa',
  description: 'Crea una nueva tarifa para la playa seleccionada',
  pageRoute: '/admin/tarifas/nuevo'
})

const breadcrumb: BreadcrumbItem[] = [
  { label: 'Tarifas', href: '/admin/tarifas' },
  {
    label: 'Crear nueva tarifa',
    href: `/admin/tarifas/nuevo`
  }
]

export default async function NuevoTarifaPage() {
  const user = await getAuthenticatedUser()
  const isDueno = user?.roles.includes(ROL.DUENO) || false

  if (!isDueno) {
    redirect('/admin/tarifas')
  }

  return (
    <PageContainer className="space-y-6 sm:px-6" breadcrumb={breadcrumb}>
      <div className="px-6 sm:px-0">
        <h1>Crear nueva tarifa</h1>
        <p className="text-muted-foreground mt-2">
          Crea una nueva tarifa para la playa seleccionada
        </p>
      </div>

      <CreateTarifaForm />
    </PageContainer>
  )
}
