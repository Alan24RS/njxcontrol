import { Link } from 'next-view-transitions'

import { UserPlus } from 'lucide-react'

import { buttonVariants } from '@/components/ui'
import { cn } from '@/lib/utils'
export default function ActionButton() {
  return (
    <div className="flex items-center gap-2">
      <Link
        href="/admin/playeros/invitar"
        className={cn(
          buttonVariants({ variant: 'default' }),
          'hidden w-fit sm:flex'
        )}
      >
        Agregar nuevo
      </Link>
      <Link
        href="/admin/playeros/invitar"
        className={cn(
          buttonVariants({ variant: 'default' }),
          'fixed right-6 bottom-6 z-20 h-12 w-12 rounded-full p-2 sm:hidden'
        )}
      >
        <UserPlus className="size-6" />
      </Link>
    </div>
  )
}
