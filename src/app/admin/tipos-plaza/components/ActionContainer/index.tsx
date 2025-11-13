import { Link } from 'next-view-transitions'

import { PlusIcon } from 'lucide-react'

import { buttonVariants } from '@/components/ui/button'
import { ROL } from '@/constants/rol'
import { getAuthenticatedUser } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'

export default async function ActionContainer() {
  const user = await getAuthenticatedUser()
  const isDueno = user?.roles.includes(ROL.DUENO) || false

  if (!isDueno) {
    return null
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/admin/tipos-plaza/nuevo"
        className={cn(
          buttonVariants({ variant: 'default' }),
          'hidden w-fit sm:flex'
        )}
      >
        Crear
      </Link>
      <Link
        href="/admin/tipos-plaza/nuevo"
        className={cn(
          buttonVariants({ variant: 'default' }),
          'fixed right-6 bottom-6 z-20 h-12 w-12 rounded-full p-2 sm:hidden'
        )}
      >
        <PlusIcon className="size-6" />
      </Link>
    </div>
  )
}
