import { PageContainer } from '@/components/layout'

import CreatePlayaForm from './components/CreatePlayaForm'

export default async function NuevaPlayaPage() {
  return (
    <PageContainer className="px-6">
      <div className="max-w-2xl">
        <div className="mb-8">
          <h1>Registrar nueva playa</h1>
          <p className="text-muted-foreground mt-2">
            Completa los datos de tu playa de estacionamiento para comenzar a
            gestionarla.
          </p>
        </div>

        <CreatePlayaForm />
      </div>
    </PageContainer>
  )
}
