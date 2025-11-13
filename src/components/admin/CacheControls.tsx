'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { useRevalidateCache } from '@/hooks/useRevalidateCache'

export function CacheControls() {
  const { revalidate, isLoading, error } = useRevalidateCache()
  const [lastRevalidated, setLastRevalidated] = useState<string | null>(null)

  const handleRevalidate = async (type: Parameters<typeof revalidate>[0]) => {
    try {
      await revalidate(type)
      setLastRevalidated(new Date().toLocaleString())
    } catch (err) {
      console.error('Error revalidando:', err)
    }
  }

  const cacheOptions = [
    {
      key: 'playas',
      label: 'Playas',
      description: 'Revalida todas las funciones de playas'
    },
    {
      key: 'playa-stats',
      label: 'Estadísticas',
      description: 'Revalida estadísticas de playas'
    },
    {
      key: 'playas-cercanas',
      label: 'Ubicaciones',
      description: 'Revalida playas cercanas'
    },
    {
      key: 'metodos-pago',
      label: 'Métodos de Pago',
      description: 'Revalida métodos de pago'
    },
    {
      key: 'modalidades-ocupacion',
      label: 'Modalidades',
      description: 'Revalida modalidades de ocupación'
    },
    {
      key: 'tipos-plaza',
      label: 'Tipos de Plaza',
      description: 'Revalida tipos de plaza'
    },
    {
      key: 'tipos-vehiculo',
      label: 'Tipos de Vehículo',
      description: 'Revalida tipos de vehículo'
    },
    { key: 'tarifas', label: 'Tarifas', description: 'Revalida tarifas' },
    { key: 'plazas', label: 'Plazas', description: 'Revalida plazas' },
    {
      key: 'all',
      label: 'Todo el Cache',
      description: 'Revalida todo el sistema de cache'
    }
  ] as const

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>Control de Cache</CardTitle>
        <CardDescription>
          Revalida manualmente el cache del sistema para forzar la actualización
          de datos.
          {lastRevalidated && (
            <span className="mt-2 block text-sm text-green-600">
              Última revalidación: {lastRevalidated}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3">
            <p className="text-sm text-red-600">Error: {error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cacheOptions.map((option) => (
            <div key={option.key} className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                disabled={isLoading}
                onClick={() => handleRevalidate(option.key)}
              >
                {isLoading ? 'Revalidando...' : option.label}
              </Button>
              <p className="text-muted-foreground px-1 text-xs">
                {option.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-md border border-blue-200 bg-blue-50 p-4">
          <h4 className="mb-2 text-sm font-medium text-blue-900">
            Información del Cache
          </h4>
          <ul className="space-y-1 text-xs text-blue-700">
            <li>
              • El cache se revalida automáticamente después de crear,
              actualizar o eliminar datos
            </li>
            <li>
              • Los tiempos de cache varían según el tipo de dato (1 minuto a 1
              hora)
            </li>
            <li>
              • La revalidación manual es útil para debugging o actualizaciones
              inmediatas
            </li>
            <li>
              • &quot;Todo el Cache&quot; puede impactar el rendimiento
              temporalmente
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
