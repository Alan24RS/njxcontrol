'use client'

import { cn } from '@/lib/utils'

export type StatusType =
  | 'ACTIVO'
  | 'SUSPENDIDO'
  | 'BORRADOR'
  | 'PENDIENTE'
  | 'COMPLETADO'
  | 'CANCELADO'
  | 'FINALIZADO'

export type StatusBadgeProps = {
  status: StatusType | string
  className?: string
  size?: 'sm' | 'default' | 'lg'
}

const statusConfig: Record<
  StatusType,
  {
    label: string
    colorClasses: string
  }
> = {
  ACTIVO: {
    label: 'Activo',
    // MODO CLARO: verde oscuro / MODO OSCURO: verde claro
    colorClasses: 'font-bold text-green-600 dark:text-green-400'
  },
  SUSPENDIDO: {
    label: 'Suspendido',
    // MODO CLARO Y OSCURO: Naranja/amarillo visible
    colorClasses: 'font-bold text-orange-500 dark:text-yellow-500'
  },
  BORRADOR: {
    label: 'Borrador',
    //MODO CLARO: gris intenso / MODO OSCURO: gris claro
    colorClasses: 'font-bold text-gray-700 dark:text-gray-400'
  },
  PENDIENTE: {
    label: 'Pendiente',
    // Se mantiene un estilo similar al suspendido para consistencia
    colorClasses: 'font-bold text-blue-600 dark:text-blue-400'
  },
  COMPLETADO: {
    label: 'Completado',
    colorClasses: 'font-bold text-green-600 dark:text-green-400'
  },
  CANCELADO: {
    label: 'Cancelado',
    colorClasses: 'font-bold text-red-600 dark:text-red-500'
  },
  FINALIZADO: {
    label: 'Finalizado',
    // Similar a COMPLETADO pero con color distintivo
    colorClasses: 'font-bold text-gray-700 dark:text-gray-300'
  }
}

export function StatusBadge({
  status,
  className,
  size = 'default'
}: StatusBadgeProps) {
  const config =
    status in statusConfig
      ? statusConfig[status as StatusType]
      : {
          label: status.charAt(0).toUpperCase() + status.slice(1),
          colorClasses: 'font-bold text-gray-700 dark:text-gray-300'
        }

  if (!config) {
    return (
      <span
        className={cn(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize',
          'border-gray-300 bg-gray-100 text-gray-700 dark:border-gray-600 dark:bg-gray-800/50 dark:text-gray-300',
          className
        )}
      >
        {status.toLowerCase()}
      </span>
    )
  }

  const sizeClasses = {
    sm: 'text-xs',
    default: 'text-xs',
    lg: 'text-sm'
  }

  return (
    <span
      className={cn(
        'inline-flex items-center font-semibold transition-colors',
        config.colorClasses,
        sizeClasses[size],
        className
      )}
    >
      {config.label}
    </span>
  )
}
