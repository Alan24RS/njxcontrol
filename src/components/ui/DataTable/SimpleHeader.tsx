import { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export default function SimpleHeader({
  children,
  className
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex h-full w-full items-center justify-center px-4 py-2 text-center font-medium',
        className
      )}
    >
      {children}
    </div>
  )
}
