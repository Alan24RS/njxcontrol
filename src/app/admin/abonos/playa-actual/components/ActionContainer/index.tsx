import { Link } from 'next-view-transitions'

import { PlusIcon } from 'lucide-react'

import { buttonVariants } from '@/components/ui'
import { cn } from '@/lib/utils'

export default function ActionContainer() {
  return (
    <div className="flex items-center gap-2">
      <Link
        href="/admin/abonos/nuevo"
        className={cn(
          buttonVariants({ variant: 'default' }),
          'hidden w-fit sm:flex'
        )}
      >
        Crear nuevo
      </Link>
      <Link
        href="/admin/abonos/nuevo"
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
