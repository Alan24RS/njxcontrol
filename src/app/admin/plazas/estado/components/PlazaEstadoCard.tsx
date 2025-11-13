'use client'

import { Car, ParkingCircleOff, XCircle } from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui'
import { cn } from '@/lib/utils'
import type {
  EstadoOperativoPlaza,
  PlazaConEstado
} from '@/services/plazas/types'

interface PlazaEstadoCardProps {
  plaza: PlazaConEstado
}

const estadoConfig: Record<
  EstadoOperativoPlaza,
  {
    bgClass: string
    textClass: string
    icon: React.ElementType
  }
> = {
  Disponible: {
    bgClass:
      'bg-green-100 border-green-300 dark:bg-green-900/40 dark:border-green-700',
    textClass: 'text-green-700 dark:text-green-300',
    icon: ParkingCircleOff
  },
  Ocupada: {
    bgClass: 'bg-red-100 border-red-300 dark:bg-red-900/40 dark:border-red-700',
    textClass: 'text-red-700 dark:text-red-300',
    icon: Car
  },
  'Fuera de servicio': {
    bgClass:
      'bg-gray-100 border-gray-300 dark:bg-gray-800/40 dark:border-gray-600',
    textClass: 'text-gray-500 dark:text-gray-400 line-through',
    icon: XCircle
  }
}

export default function PlazaEstadoCard({ plaza }: PlazaEstadoCardProps) {
  const config = estadoConfig[plaza.estado_operativo]
  const Icon = config.icon

  return (
    <Card
      className={cn(
        'flex flex-col items-center justify-center p-0 transition-all',
        config.bgClass
      )}
    >
      <CardHeader className="p-3 pb-2 text-center">
        <CardDescription className={cn('font-medium', config.textClass)}>
          {plaza.tipo_plaza_nombre}
        </CardDescription>
        <CardTitle
          className={cn('text-xl font-bold tracking-tight', config.textClass)}
        >
          {plaza.identificador || '-'}
        </CardTitle>
      </CardHeader>
      <CardContent className={cn('p-3 pt-0', config.textClass)}>
        <Icon className="h-6 w-6" />
      </CardContent>
    </Card>
  )
}
