import { ReactNode } from 'react'

import { Link } from 'next-view-transitions'

import { cn } from '@/lib/utils'

export default function CellLink({
  children,
  className,
  href
}: {
  children: ReactNode
  className?: string
  href: string
}) {
  return (
    <>
      <div className="invisible p-4" aria-hidden="true">
        {children}
      </div>
      <Link
        href={href}
        className={cn(
          'cell-link absolute inset-0 flex items-center justify-center p-4',
          className
        )}
      >
        {children}
      </Link>
    </>
  )
}
