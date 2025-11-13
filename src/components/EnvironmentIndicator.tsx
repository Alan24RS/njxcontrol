'use client'

import { Fragment } from 'react'

import { getEnvironmentInfo } from '@/lib/environment'
import { cn } from '@/lib/utils'

interface EnvironmentIndicatorProps {
  className?: string
}

export function EnvironmentIndicator({ className }: EnvironmentIndicatorProps) {
  const envInfo = getEnvironmentInfo()

  // No mostrar el indicador en producción
  if (envInfo.environment === 'production') {
    return null
  }

  return (
    <Fragment>
      <div
        className={cn('fixed top-0 z-[9999] h-[2px] w-full', envInfo.color)}
      />
      <div
        className={cn(
          'fixed top-0 left-1/2 z-[9999] -translate-x-1/2 transform',
          'rounded-b-lg px-3 py-1 shadow-lg',
          envInfo.color,
          envInfo.textColor,
          'text-xs font-bold tracking-wider',
          'pointer-events-none select-none',
          className
        )}
      >
        {envInfo.name}
      </div>
    </Fragment>
  )
}
