import { redirect } from 'next/navigation'

import { PlayaWidget } from '@/app/admin/components/Widget/PlayaWidget'
import { PageContainer } from '@/components/layout'
import { getAuthenticatedUser } from '@/lib/supabase/server'
import { getPlayaStats } from '@/services/playas'

export default async function AdminHomePage() {
  const user = await getAuthenticatedUser()

  if (!user) {
    redirect('/login')
  }

  const playaStats = await getPlayaStats(user.id)

  return (
    <PageContainer className="px-6">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            ¡Hola, {user.name || user.email}! 👋🏼
          </h1>
          <p className="text-muted-foreground">
            Bienvenido a tu panel de administración
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {playaStats.data && <PlayaWidget stats={playaStats.data} />}
        </div>
      </div>
    </PageContainer>
  )
}
