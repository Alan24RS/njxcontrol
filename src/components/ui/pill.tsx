import type { ComponentProps } from 'react'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export type PillProps = ComponentProps<typeof Badge> & {
  themed?: boolean
}

export const Pill = ({
  variant = 'secondary',
  className,
  ...props
}: PillProps) => (
  <Badge
    className={cn('gap-2 rounded-full px-3 py-1.5 font-normal', className)}
    variant={variant}
    {...props}
  />
)

export type PillIndicatorProps = {
  variant?: 'success' | 'error' | 'warning' | 'info'
  pulse?: boolean
}

export const PillIndicator = ({
  variant = 'success',
  pulse = false
}: PillIndicatorProps) => (
  <span className="relative flex size-2">
    {pulse && (
      <span
        className={cn(
          'absolute inline-flex h-full w-full animate-ping rounded-full opacity-75',
          variant === 'success' && 'bg-emerald-400',
          variant === 'error' && 'bg-rose-400',
          variant === 'warning' && 'bg-amber-400',
          variant === 'info' && 'bg-sky-400'
        )}
      />
    )}
    <span
      className={cn(
        'relative inline-flex size-2 rounded-full',
        variant === 'success' && 'bg-emerald-500',
        variant === 'error' && 'bg-rose-500',
        variant === 'warning' && 'bg-amber-500',
        variant === 'info' && 'bg-sky-500'
      )}
    />
  </span>
)
