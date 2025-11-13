import { PageContainer } from '@/components/layout'
import { BreadcrumbItem } from '@/components/layout/Breadcrumb'

import InvitarPlayeroContent from './components/InvitarPlayeroContent'

export default async function InvitarPlayeroPage() {
  const breadcrumb: BreadcrumbItem[] = [
    { label: 'Playeros', href: '/admin/playeros' },
    { label: 'Invitar playero', href: '/admin/playeros/invitar' }
  ]

  return (
    <PageContainer className="space-y-6 sm:px-6" breadcrumb={breadcrumb}>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Invitar a un nuevo playero
        </h1>
        <p className="text-muted-foreground">
          Incorporá un nuevo playero a tus playas
        </p>
      </div>

      <InvitarPlayeroContent />
    </PageContainer>
  )
}
