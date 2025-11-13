import { Link } from 'next-view-transitions'

import { PlusIcon } from 'lucide-react'

import { buttonVariants } from '@/components/ui'
import { getAuthenticatedUser } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'

import CreateCompletePlayaModal from './CreateCompletePlayaModal'
import DropdownActions from './DropdownActions'

export default async function ActionContainer() {
  const user = await getAuthenticatedUser()

  return (
    <div className="flex items-center gap-2">
      <CreateCompletePlayaModal
        userName={user?.name || user?.email?.split('@')[0] || 'Usuario'}
      />
      <Link
        href="/admin/playas/nueva"
        className={cn(
          buttonVariants({ variant: 'default' }),
          'hidden w-fit sm:flex'
        )}
      >
        Crear
      </Link>
      <Link
        href="/admin/playas/nueva"
        className={cn(
          buttonVariants({ variant: 'default' }),
          'fixed right-6 bottom-6 z-20 h-12 w-12 rounded-full p-2 sm:hidden'
        )}
      >
        <PlusIcon className="size-6" />
      </Link>
      <DropdownActions />
    </div>
  )
}
