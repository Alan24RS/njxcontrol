'use client'

import { useState } from 'react'

import { Download } from 'lucide-react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useRecaudacionPorPlaya } from '@/hooks/queries/analytics/useRecaudacionPorPlaya'
import { useGetUserPlayas } from '@/hooks/queries/playas/useGetUserPlayas'
import type { RecaudacionPorPlayaFiltersInput } from '@/schemas/analytics/recaudacion-por-playa'
import { exportRecaudacionToExcel } from '@/utils/analytics'

import { RecaudacionPorPlayaChart } from './components/RecaudacionPorPlayaChart'
import { RecaudacionPorPlayaFilters } from './components/RecaudacionPorPlayaFilters'
import { RecaudacionPorPlayaTable } from './components/RecaudacionPorPlayaTable'

export function RecaudacionPorPlayaContent() {
  const [filters, setFilters] = useState<RecaudacionPorPlayaFiltersInput>({
    fecha_desde: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    fecha_hasta: new Date(),
    playa_id: null
  })

  const { data, isLoading, isError, error } = useRecaudacionPorPlaya(filters)
  const { playas, isLoading: isLoadingPlayas } = useGetUserPlayas()

  const handleExport = () => {
    if (data && data.data.length > 0) {
      exportRecaudacionToExcel(data.data)
    }
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <RecaudacionPorPlayaFilters
        playas={
          playas
            ?.filter((p) => p.nombre) // Filtrar playas sin nombre
            .map((p) => ({
              playa_id: p.id,
              nombre: p.nombre!
            })) || []
        }
        onFilterChange={setFilters}
        isLoadingPlayas={isLoadingPlayas}
      />

      {/* KPIs */}
      {data && (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="bg-card rounded-lg border p-6">
            <div className="text-muted-foreground text-sm font-medium">
              Recaudación Total
            </div>
            <div className="mt-2 text-3xl font-bold text-green-600">
              {new Intl.NumberFormat('es-AR', {
                style: 'currency',
                currency: 'ARS',
                minimumFractionDigits: 0
              }).format(data.totales.recaudacion_total)}
            </div>
          </div>
          <div className="bg-card rounded-lg border p-6">
            <div className="text-muted-foreground text-sm font-medium">
              Recaudación Abonos
            </div>
            <div className="mt-2 text-3xl font-bold text-green-700">
              {new Intl.NumberFormat('es-AR', {
                style: 'currency',
                currency: 'ARS',
                minimumFractionDigits: 0
              }).format(data.totales.recaudacion_abonos)}
            </div>
          </div>
          <div className="bg-card rounded-lg border p-6">
            <div className="text-muted-foreground text-sm font-medium">
              Recaudación Ocupaciones
            </div>
            <div className="mt-2 text-3xl font-bold text-orange-600">
              {new Intl.NumberFormat('es-AR', {
                style: 'currency',
                currency: 'ARS',
                minimumFractionDigits: 0
              }).format(data.totales.recaudacion_ocupaciones)}
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-[400px] w-full" />
          <Skeleton className="h-[500px] w-full" />
        </div>
      )}

      {/* Error */}
      {isError && (
        <Alert variant="destructive">
          <AlertDescription>
            Error al cargar datos: {error?.message || 'Error desconocido'}
          </AlertDescription>
        </Alert>
      )}

      {/* Gráfico */}
      {data && data.dataDiaria.length > 0 && (
        <>
          <RecaudacionPorPlayaChart data={data.dataDiaria} />

          {/* Botón Export */}
          <div className="flex justify-end">
            <Button onClick={handleExport} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Exportar a Excel
            </Button>
          </div>

          {/* Tabla */}
          <RecaudacionPorPlayaTable data={data.pagos} />
        </>
      )}

      {/* Sin datos */}
      {data && data.data.length === 0 && (
        <Alert>
          <AlertDescription>
            No se encontraron datos para los filtros seleccionados.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
