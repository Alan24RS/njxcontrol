import { Topbar } from '@/components/layout'
import { MessageCard } from '@/components/ui/MessageCard'
import { checkSupabaseHealth } from '@/lib/supabase/health-check'

import MapaContainer from './components/MapaContainer'

export const dynamic = 'force-dynamic'

export default async function MapaPage() {
  const isSupabaseHealthy = await checkSupabaseHealth()

  if (!isSupabaseHealthy) {
    return (
      <MessageCard
        title="Servicio no disponible"
        description="No pudimos conectar con la base de datos"
      />
    )
  }

  return (
    <div className="flex h-screen w-full flex-col">
      <Topbar />
      <MapaContainer />
    </div>
  )
}
