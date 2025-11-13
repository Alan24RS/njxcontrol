import { Suspense } from 'react'

import { redirect } from 'next/navigation'

import NextTopLoader from 'nextjs-toploader'

import { AppSidebar } from '@/components/layout/Sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui'
import { ROL } from '@/constants/rol'
import { HiddenColumnsProvider } from '@/contexts'
import { getAuthenticatedUser } from '@/lib/supabase/server'
import { getPlayas } from '@/services/playas'

import CompletePlayaSetupModal from './components/CompletePlayaSetupModal'

export default async function AdminLayout({
  children
}: {
  children: React.ReactNode
}) {
  const user = await getAuthenticatedUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: playas } = await getPlayas()
  const hasPlayas = playas ? playas.length > 0 : false
  const showWelcomeModal = !hasPlayas && user.roles.includes(ROL.DUENO)

  return (
    <SidebarProvider>
      <AppSidebar user={user} playas={playas || []} />
      <NextTopLoader color="#DC2626" height={1} showSpinner={false} />
      <HiddenColumnsProvider>
        <SidebarInset>{children}</SidebarInset>
      </HiddenColumnsProvider>
      {showWelcomeModal && (
        <Suspense fallback={null}>
          <CompletePlayaSetupModal
            userName={user.name || user.email?.split('@')[0]}
            isOpen={showWelcomeModal}
            mode="welcome"
          />
        </Suspense>
      )}
    </SidebarProvider>
  )
}
